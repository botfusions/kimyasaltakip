'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { parseMaterialFormData, formatZodErrors } from '@/lib/validations';

/**
 * Check if current user has materials management access (admin or lab)
 */
async function checkMaterialsAccess() {
    const currentUser = await getCurrentUser();

    if (!currentUser || !['admin', 'lab'].includes(currentUser.role)) {
        throw new Error('Bu işlem için yetkiniz yok');
    }

    return currentUser;
}

/**
 * Get all materials with optional filters
 */
export async function getMaterials(filters?: {
    type?: string;
    search?: string;
    is_active?: boolean;
}) {
    await checkMaterialsAccess();

    const supabase = await createClient();

    let query = supabase
        .from('kts_materials')
        .select('*')
        .order('name', { ascending: true });

    // Apply filters
    if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
    }

    if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
        return {
            error: 'Malzemeler yüklenirken hata oluştu',
        };
    }

    return { data };
}

/**
 * Get single material by ID
 */
export async function getMaterialById(materialId: string) {
    await checkMaterialsAccess();

    const supabase = await createClient();

    const { data, error } = await supabase
        .from('kts_materials')
        .select('*')
        .eq('id', materialId)
        .single();

    if (error) {
        return { error: 'Malzeme bulunamadı' };
    }

    return { data };
}

/**
 * Create new material (Admin or Lab only)
 */
export async function createMaterial(formData: FormData) {
    const currentUser = await checkMaterialsAccess();

    // Validate with Zod schema
    const validation = parseMaterialFormData(formData);
    if (!validation.success) {
        return { error: formatZodErrors(validation.error) };
    }

    const materialData = {
        ...validation.data,
        description: validation.data.description || null,
        category: validation.data.category || null,
        supplier_info: validation.data.supplier_info || null,
        safety_info: validation.data.safety_info || null,
    };


    // Use admin client to bypass RLS for creation
    const supabase = createAdminClient();

    // Insert material
    const { data, error } = await supabase
        .from('kts_materials')
        .insert({

            ...materialData,
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') { // Unique violation
            return { error: 'Bu malzeme kodu zaten kullanılıyor' };
        }
        console.error('Material create error:', error);
        return { error: `Malzeme oluşturulurken hata oluştu: ${error.message} (${error.code})` };
    }

    // Log audit
    await supabase.from('kts_audit_logs').insert({
        table_name: 'materials',
        record_id: data.id,
        action: 'INSERT',
        user_id: currentUser.id,
        changes: { new: materialData },
    });

    revalidatePath('/dashboard/materials');

    return { success: true, data };
}

/**
 * Update existing material (Admin or Lab only)
 */
export async function updateMaterial(materialId: string, formData: FormData) {
    const currentUser = await checkMaterialsAccess();

    // Validate with Zod schema
    const validation = parseMaterialFormData(formData);
    if (!validation.success) {
        return { error: formatZodErrors(validation.error) };
    }

    const materialData = {
        ...validation.data,
        description: validation.data.description || null,
        category: validation.data.category || null,
        supplier_info: validation.data.supplier_info || null,
        safety_info: validation.data.safety_info || null,
    };

    const supabase = await createClient();

    // Get old data for audit
    const { data: oldData } = await supabase
        .from('kts_materials')
        .select('*')
        .eq('id', materialId)
        .single();

    // Update material
    const { data, error } = await supabase
        .from('kts_materials')
        .update({
            ...materialData,
            updated_at: new Date().toISOString(),
        })
        .eq('id', materialId)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            return { error: 'Bu malzeme kodu zaten kullanılıyor' };
        }
        return { error: 'Malzeme güncellenirken hata oluştu' };
    }

    // Log audit
    await supabase.from('kts_audit_logs').insert({
        table_name: 'materials',
        record_id: materialId,
        action: 'UPDATE',
        user_id: currentUser.id,
        changes: { old: oldData, new: materialData },
    });

    revalidatePath('/dashboard/materials');

    return { success: true, data };
}

/**
 * Toggle material active status (Admin or Lab only)
 */
export async function toggleMaterialStatus(materialId: string) {
    const currentUser = await checkMaterialsAccess();

    const supabase = await createClient();

    // Get current status
    const { data: material } = await supabase
        .from('kts_materials')
        .select('is_active')
        .eq('id', materialId)
        .single();

    if (!material) {
        return { error: 'Malzeme bulunamadı' };
    }

    const newStatus = !material.is_active;

    // Update status
    const { error } = await supabase
        .from('kts_materials')
        .update({
            is_active: newStatus,
            updated_at: new Date().toISOString(),
        })
        .eq('id', materialId);

    if (error) {
        return { error: 'Durum değiştirilirken hata oluştu' };
    }

    // Log audit
    await supabase.from('kts_audit_logs').insert({
        table_name: 'materials',
        record_id: materialId,
        action: 'UPDATE',
        user_id: currentUser.id,
        changes: {
            old: { is_active: material.is_active },
            new: { is_active: newStatus },
        },
    });

    revalidatePath('/dashboard/materials');

    return { success: true };
}
