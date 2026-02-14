'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { sendEmail } from '@/lib/email';
import { sendTelegramAlert } from '@/lib/telegram';
import { getSettingByKey } from '@/app/actions/settings';
import { checkRecipeCompliance } from './compliance';

/**
 * Check if current user has recipe management access (admin or lab)
 */
async function checkRecipeAccess() {
    const currentUser = await getCurrentUser();

    if (!currentUser || !['admin', 'lab'].includes(currentUser.role)) {
        throw new Error('Bu işlem için yetkiniz yok');
    }

    return currentUser;
}

/**
 * Get all recipes with optional filters
 */
export async function getRecipes(filters?: {
    product_id?: string;
    status?: string;
    search?: string;
}) {
    await checkRecipeAccess();

    const supabase = await createClient();

    let query = supabase
        .from('recipes')
        .select(`
            *,
            product:products(id, code, name),
            created_by_user:users!recipes_created_by_fkey(id, name),
            approved_by_user:users!recipes_approved_by_fkey(id, name, signature_id)
        `)
        .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
    }

    if (filters?.status) {
        query = query.eq('status', filters.status);
    }

    if (filters?.search) {
        query = query.or(`version_code.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
        return {
            error: 'Reçeteler yüklenirken hata oluştu',
        };
    }

    return { data };
}

/**
 * Get single recipe by ID with full details
 */
export async function getRecipeById(recipeId: string) {
    await checkRecipeAccess();

    const supabase = await createClient();

    const { data, error } = await supabase
        .from('recipes')
        .select(`
            *,
            product:products(id, code, name),
            created_by_user:users!recipes_created_by_fkey(id, name, email),
            approved_by_user:users!recipes_approved_by_fkey(id, name, email, signature_id),
            recipe_items(
                id,
                material_id,
                quantity,
                sort_order,
                unit,
                notes,
                material:materials(id, code, name, unit, safety_info)
            )
        `)
        .eq('id', recipeId)
        .single();

    if (error) {
        console.error('getRecipeById SUPABASE ERROR:', error);
        return { error: `DEBUG: DB Error - ${error.message} (Code: ${error.code})` };
    }

    return { data };
}

/**
 * Create new recipe (Lab user only - NO signature ID required)
 */
export async function createRecipe(formData: FormData) {
    const currentUser = await checkRecipeAccess();

    // Only lab and admin users can create recipes
    if (!['lab', 'admin'].includes(currentUser.role)) {
        return { error: 'Sadece laboratuvar ve yönetici kullanıcıları reçete oluşturabilir' };
    }

    const productId = formData.get('product_id') as string;
    const versionCode = formData.get('version_code') as string;
    const notes = formData.get('notes') as string || null;
    const itemsJson = formData.get('items') as string;

    // New PDF form fields
    const recipeNameNo = formData.get('recipe_name_no') as string || null;
    const colorCode = formData.get('color_code') as string || null;
    const yarnCode = formData.get('yarn_code') as string || null;
    const planningDate = formData.get('planning_date') as string || null;
    const startDate = formData.get('start_date') as string || null;
    const finishDate = formData.get('finish_date') as string || null;
    const batchRatio = formData.get('batch_ratio') as string;
    const processWashCount = formData.get('process_wash_count') as string;
    const cauldronQuantity = formData.get('cauldron_quantity') as string;

    // Additional fields from RecipeEditor
    const orderCode = formData.get('order_code') as string || null;
    const processInfo = formData.get('process_info') as string || null;
    const totalWeight = formData.get('total_weight') as string;
    const machineCode = formData.get('machine_code') as string || null;
    const colorName = formData.get('color_name') as string || null;
    const workOrderDate = formData.get('work_order_date') as string || null;
    const bathVolume = formData.get('bath_volume') as string;
    const sipNo = formData.get('sip_no') as string || null;
    const customerRefNo = formData.get('customer_ref_no') as string || null;
    const customerName = formData.get('customer_name') as string || null;
    const customerSipMt = formData.get('customer_sip_mt') as string;
    const customerOrderNo = formData.get('customer_order_no') as string || null;
    const yarnType = formData.get('yarn_type') as string || null;

    // Auto-generate versionCode if not provided
    const finalVersionCode = versionCode || orderCode || `V-${Date.now()}`;

    if (!itemsJson) {
        return { error: 'Lütfen malzeme bilgilerini doldurun' };
    }

    let items;
    try {
        items = JSON.parse(itemsJson);
    } catch {
        return { error: 'Geçersiz malzeme verisi' };
    }

    if (!Array.isArray(items) || items.length === 0) {
        return { error: 'En az bir malzeme eklemelisiniz' };
    }

    const supabase = await createClient();

    // Get a default usage type if not provided (it's mandatory in DB)
    let usageTypeId = formData.get('usage_type_id') as string;
    if (!usageTypeId) {
        const { data: usageTypes } = await supabase.from('usage_types').select('id').limit(1);
        if (usageTypes && usageTypes.length > 0) {
            usageTypeId = usageTypes[0].id;
        }
    }

    // Insert recipe with status 'draft'
    const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
            product_id: productId || null,
            usage_type_id: usageTypeId, // Add this back
            version_code: finalVersionCode,
            status: 'draft',
            notes,
            created_by: currentUser.id,
            recipe_name_no: recipeNameNo || orderCode, // Map orderCode to existing recipe_name_no as a fallback
            color_code: colorCode,
            yarn_code: yarnCode || yarnType, // Map yarnType to existing yarn_code
            planning_date: planningDate,
            start_date: startDate,
            finish_date: finishDate,
            batch_ratio: batchRatio, // This exists in schema
            process_wash_count: processWashCount ? parseInt(processWashCount, 10) : null,
            cauldron_quantity: cauldronQuantity ? parseFloat(cauldronQuantity) : null,
            // Only keeping available columns
        })
        .select()
        .single();

    if (recipeError) {
        if (recipeError.code === '23505') {
            return { error: 'Bu versiyon kodu zaten kullanılıyor' };
        }
        console.error('Reçete oluşturma hatası (DB):', recipeError);
        await sendTelegramAlert(`Reçete oluşturma hatası (DB Insert)`, { error: recipeError, user: currentUser.id });
        return { error: 'Reçete oluşturulurken hata oluştu' };
    }

    // Insert recipe items
    const recipeItems = items.map((item: any) => ({
        recipe_id: recipe.id,
        material_id: item.material_id,
        quantity: parseFloat(item.quantity),
        percentage: parseFloat(item.percentage),
        unit: item.unit || 'kg',
        notes: item.notes || null,
    }));

    const { error: itemsError } = await supabase
        .from('recipe_items')
        .insert(recipeItems);

    if (itemsError) {
        // Rollback recipe if items insertion fails
        await supabase.from('recipes').delete().eq('id', recipe.id);
        await sendTelegramAlert(`Reçete malzeme ekleme hatası`, { error: itemsError, user: currentUser.id });
        return { error: 'Malzemeler eklenirken hata oluştu' };
    }

    // Log audit
    await supabase.from('audit_logs').insert({
        table_name: 'recipes',
        record_id: recipe.id,
        action: 'INSERT',
        user_id: currentUser.id,
        changes: { new: { product_id: productId, version_code: versionCode, status: 'draft' } },
    });

    revalidatePath('/dashboard/recipes');

    revalidatePath('/dashboard/recipes');

    // Perform automatic compliance check
    const complianceResult = await checkRecipeCompliance(recipe.id);

    return { success: true, data: recipe, compliance: complianceResult };
}

/**
 * Update recipe (Lab user only - NO signature ID required)
 */
export async function updateRecipe(recipeId: string, formData: FormData) {
    const currentUser = await checkRecipeAccess();

    if (currentUser.role !== 'lab') {
        return { error: 'Sadece laboratuvar kullanıcıları reçete düzenleyebilir' };
    }

    const supabase = await createClient();

    // Check if recipe exists and is editable
    const { data: existingRecipe } = await supabase
        .from('recipes')
        .select('status, created_by')
        .eq('id', recipeId)
        .single();

    if (!existingRecipe) {
        return { error: 'Reçete bulunamadı' };
    }

    if (existingRecipe.status === 'approved') {
        return { error: 'Onaylanmış reçeteler düzenlenemez' };
    }

    const versionCode = formData.get('version_code') as string;
    const notes = formData.get('notes') as string || null;
    const itemsJson = formData.get('items') as string;

    // New PDF form fields
    const recipeNameNo = formData.get('recipe_name_no') as string || null;
    const colorCode = formData.get('color_code') as string || null;
    const yarnCode = formData.get('yarn_code') as string || null;
    const planningDate = formData.get('planning_date') as string || null;
    const startDate = formData.get('start_date') as string || null;
    const finishDate = formData.get('finish_date') as string || null;
    const batchRatio = formData.get('batch_ratio') as string;
    const processWashCount = formData.get('process_wash_count') as string;
    const cauldronQuantity = formData.get('cauldron_quantity') as string;

    // Additional fields from RecipeEditor
    const orderCode = formData.get('order_code') as string || null;
    const processInfo = formData.get('process_info') as string || null;
    const totalWeight = formData.get('total_weight') as string;
    const machineCode = formData.get('machine_code') as string || null;
    const colorName = formData.get('color_name') as string || null;
    const workOrderDate = formData.get('work_order_date') as string || null;
    const bathVolume = formData.get('bath_volume') as string;
    const sipNo = formData.get('sip_no') as string || null;
    const customerRefNo = formData.get('customer_ref_no') as string || null;
    const customerName = formData.get('customer_name') as string || null;
    const customerSipMt = formData.get('customer_sip_mt') as string;
    const customerOrderNo = formData.get('customer_order_no') as string || null;
    const yarnType = formData.get('yarn_type') as string || null;

    if (!versionCode || !itemsJson) {
        return { error: 'Lütfen tüm zorunlu alanları doldurun' };
    }

    let items;
    try {
        items = JSON.parse(itemsJson);
    } catch {
        return { error: 'Geçersiz malzeme verisi' };
    }

    // Update recipe
    const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .update({
            version_code: versionCode,
            notes,
            updated_at: new Date().toISOString(),
            recipe_name_no: recipeNameNo,
            color_code: colorCode,
            yarn_code: yarnCode,
            planning_date: planningDate,
            start_date: startDate,
            finish_date: finishDate,
            batch_ratio: batchRatio ? parseFloat(batchRatio) : null,
            process_wash_count: processWashCount ? parseInt(processWashCount, 10) : null,
            cauldron_quantity: cauldronQuantity ? parseFloat(cauldronQuantity) : null,

            // Additional fields
            order_code: orderCode,
            process_info: processInfo,
            total_weight: totalWeight ? parseFloat(totalWeight) : null,
            machine_code: machineCode,
            color_name: colorName,
            work_order_date: workOrderDate,
            bath_volume: bathVolume ? parseFloat(bathVolume) : null,
            sip_no: sipNo,
            customer_ref_no: customerRefNo,
            customer_name: customerName,
            customer_sip_mt: customerSipMt ? parseFloat(customerSipMt) : null,
            customer_order_no: customerOrderNo,
            yarn_type: yarnType,
        })
        .eq('id', recipeId)
        .select()
        .single();

    if (recipeError) {
        if (recipeError.code === '23505') {
            return { error: 'Bu versiyon kodu zaten kullanılıyor' };
        }
        await sendTelegramAlert(`Reçete güncelleme hatası`, { error: recipeError, user: currentUser.id });
        return { error: 'Reçete güncellenirken hata oluştu' };
    }

    // Delete old items and insert new ones
    await supabase.from('recipe_items').delete().eq('recipe_id', recipeId);

    const recipeItems = items.map((item: any) => ({
        recipe_id: recipeId,
        material_id: item.material_id,
        quantity: parseFloat(item.quantity),
        percentage: parseFloat(item.percentage),
        unit: item.unit || 'kg',
        notes: item.notes || null,
    }));

    const { error: itemsError } = await supabase
        .from('recipe_items')
        .insert(recipeItems);

    if (itemsError) {
        return { error: 'Malzemeler güncellenirken hata oluştu' };
    }

    // Log audit
    await supabase.from('audit_logs').insert({
        table_name: 'recipes',
        record_id: recipeId,
        action: 'UPDATE',
        user_id: currentUser.id,
        changes: { new: { version_code: versionCode, notes } },
    });

    revalidatePath('/dashboard/recipes');

    revalidatePath('/dashboard/recipes');

    // Perform automatic compliance check
    const complianceResult = await checkRecipeCompliance(recipeId);

    return { success: true, data: recipe, compliance: complianceResult };
}

/**
 * Approve recipe (Lab user only - REQUIRES signature ID)
 * This is called AFTER customer acceptance
 */
export async function approveRecipe(recipeId: string, signatureId: string) {
    const currentUser = await checkRecipeAccess();

    if (currentUser.role !== 'lab') {
        return { error: 'Sadece laboratuvar kullanıcıları reçete onaylayabilir' };
    }

    if (!signatureId || signatureId.length < 4 || signatureId.length > 6) {
        return { error: 'Geçersiz imza ID formatı' };
    }

    const supabase = await createClient();

    // Verify signature ID matches current user
    const { data: user } = await supabase
        .from('users')
        .select('signature_id')
        .eq('id', currentUser.id)
        .single();

    if (!user?.signature_id || user.signature_id !== signatureId) {
        return { error: 'İmza ID hatalı - lütfen doğru ID\'yi girin' };
    }

    // Check recipe status
    const { data: recipe } = await supabase
        .from('recipes')
        .select('status, created_by')
        .eq('id', recipeId)
        .single();

    if (!recipe) {
        return { error: 'Reçete bulunamadı' };
    }

    if (recipe.status === 'approved') {
        return { error: 'Bu reçete zaten onaylanmış' };
    }

    // Update recipe to approved status
    const { error: updateError } = await supabase
        .from('recipes')
        .update({
            status: 'approved',
            approved_by: currentUser.id,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', recipeId);

    if (updateError) {
        await sendTelegramAlert(`Reçete onaylama hatası`, { error: updateError, user: currentUser.id });
        return { error: 'Reçete onaylanırken hata oluştu' };
    }

    // Log audit
    await supabase.from('audit_logs').insert({
        table_name: 'recipes',
        record_id: recipeId,
        action: 'UPDATE',
        user_id: currentUser.id,
        changes: {
            old: { status: recipe.status },
            new: { status: 'approved', approved_by: currentUser.id },
        },
    });

    revalidatePath('/dashboard/recipes');

    return { success: true };
}

/**
 * Reject recipe for revision (Lab user only - NO signature ID required)
 */
export async function rejectRecipeForRevision(recipeId: string, reason: string) {
    const currentUser = await checkRecipeAccess();

    if (currentUser.role !== 'lab') {
        return { error: 'Sadece laboratuvar kullanıcıları bu işlemi yapabilir' };
    }

    const supabase = await createClient();

    const { data: recipe } = await supabase
        .from('recipes')
        .select('status')
        .eq('id', recipeId)
        .single();

    if (!recipe) {
        return { error: 'Reçete bulunamadı' };
    }

    if (recipe.status === 'approved') {
        return { error: 'Onaylanmış reçeteler revize edilemez' };
    }

    // Update status to rejected
    const { error: updateError } = await supabase
        .from('recipes')
        .update({
            status: 'rejected',
            notes: reason,
            updated_at: new Date().toISOString(),
        })
        .eq('id', recipeId);

    if (updateError) {
        return { error: 'Reçete durumu güncellenirken hata oluştu' };
    }

    // Log audit
    await supabase.from('audit_logs').insert({
        table_name: 'recipes',
        record_id: recipeId,
        action: 'UPDATE',
        user_id: currentUser.id,
        changes: {
            old: { status: recipe.status },
            new: { status: 'rejected', reason },
        },
    });

    revalidatePath('/dashboard/recipes');


    return { success: true };
}

/**
 * Submit recipe for approval (Lab user only)
 * - Updates status to 'pending'
 * - Sends email to Manager
 */
export async function submitForApproval(recipeId: string, complianceReport: string) {
    const currentUser = await checkRecipeAccess();

    if (currentUser.role !== 'lab') {
        return { error: 'Sadece laboratuvar kullanıcıları onaya gönderebilir' };
    }

    const supabase = await createClient();

    // 1. Get current notes to append report
    const { data: currentRecipe } = await supabase
        .from('recipes')
        .select('notes, version_code, product:products(name, code)')
        .eq('id', recipeId)
        .single();

    if (!currentRecipe) return { error: 'Reçete bulunamadı' };

    // Parse report summary safely
    let reportSummary = 'MRLS Kontrolü Başarılı';
    try {
        const parsed = JSON.parse(complianceReport);
        if (parsed.summary) reportSummary = parsed.summary;
    } catch (e) {
        // use default
    }

    const newNotes = (currentRecipe.notes || '') + `\n\n[${new Date().toLocaleDateString()}] MRLS Raporu: ${reportSummary}`;

    const { data: recipe, error: updateError } = await supabase
        .from('recipes')
        .update({
            status: 'pending',
            notes: newNotes,
            updated_at: new Date().toISOString()
        })
        .eq('id', recipeId)
        .select(`
            *,
            created_by_user:users!recipes_created_by_fkey(name)
        `)
        .single();

    if (updateError) {
        return { error: 'Durum güncellenemedi: ' + updateError.message };
    }

    // 2. Send Email to Manager
    try {
        const { data: managerEmailSetting } = await getSettingByKey('MANAGER_EMAIL');
        const managerEmail = managerEmailSetting?.value || 'admin@example.com';

        await sendEmail({
            to: managerEmail,
            subject: `📌 Yeni Reçete Onayı Bekliyor: ${(currentRecipe.product as any)?.name}`,
            html: `
                <div style="font-family: sans-serif;">
                    <h2>Reçete Onay Talebi</h2>
                    <p><strong>${recipe.created_by_user?.name || 'Kullanıcı'}</strong> tarafından oluşturulan reçete MRLS kontrolünden geçti ve onayınızı bekliyor.</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <ul style="list-style: none; padding: 0;">
                            <li><strong>Ürün:</strong> ${(currentRecipe.product as any)?.name} (${(currentRecipe.product as any)?.code})</li>
                            <li><strong>Versiyon:</strong> ${currentRecipe.version_code}</li>
                            <li><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</li>
                            <li><strong>MRLS Durumu:</strong> ✅ Uyumlu</li>
                        </ul>
                    </div>

                    <p>Lütfen sisteme giriş yaparak reçeteyi inceleyin ve onaylayın.</p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/recipes/${recipe.id}" style="display:inline-block; padding:12px 24px; background-color: #2563eb; color:white; text-decoration:none; border-radius:6px; font-weight: bold;">Reçeteyi Görüntüle</a>
                </div>
            `
        });
    } catch (emailError) {
        console.error('Email sending failed:', emailError);
    }

    // Log audit
    await supabase.from('audit_logs').insert({
        table_name: 'recipes',
        record_id: recipeId,
        action: 'UPDATE',
        user_id: currentUser.id,
        changes: { old: { status: 'draft' }, new: { status: 'pending' }, note: 'Submitted for approval' }
    });

    revalidatePath('/dashboard/recipes');
    return { success: true };
}

/**
 * Start Production (Dyehouse/Production User)
 * - Updates status to 'in_production'
 * - Logs acceptance
 */
export async function startProduction(recipeId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { error: 'Yetkisiz işlem' };

    const supabase = await createClient();

    const { data: recipe, error: fetchError } = await supabase
        .from('recipes')
        .select('status')
        .eq('id', recipeId)
        .single();

    if (fetchError || !recipe) return { error: 'Reçete bulunamadı' };
    if (recipe.status !== 'approved') return { error: 'Sadece onaylı reçeteler üretime alınabilir' };

    const { error: updateError } = await supabase
        .from('recipes')
        .update({
            status: 'in_production',
            updated_at: new Date().toISOString()
        })
        .eq('id', recipeId);

    if (updateError) return { error: 'Üretim başlatılamadı' };

    // Log audit
    await supabase.from('audit_logs').insert({
        table_name: 'recipes',
        record_id: recipeId,
        action: 'UPDATE',
        user_id: currentUser.id,
        changes: {
            old: { status: 'approved' },
            new: { status: 'in_production' },
            note: 'Production started/accepted by user'
        }
    });

    revalidatePath('/dashboard/recipes');
    return { success: true };
}
