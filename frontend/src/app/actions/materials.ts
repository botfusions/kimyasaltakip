'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';

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
        .from('materials')
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
        .from('materials')
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

    const materialData = {
        code: formData.get('code') as string,
        name: formData.get('name') as string,
        description: formData.get('description') as string || null,
        unit: formData.get('unit') as string,
        category: formData.get('category') as string || null,
        critical_level: parseFloat(formData.get('critical_level') as string) || 0,
        supplier_info: formData.get('supplier_info') as string || null,
        safety_info: formData.get('safety_info') as string || null,
        is_active: formData.get('is_active') === 'true',
    };

    // Validate required fields
    if (!materialData.code || !materialData.name || !materialData.unit) {
        return { error: 'Lütfen tüm zorunlu alanları doldurun' };
    }

    const supabase = await createClient();

    // Insert material
    const { data, error } = await supabase
        .from('materials')
        .insert({
            ...materialData,
            created_by: currentUser.id,
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') { // Unique violation
            return { error: 'Bu malzeme kodu zaten kullanılıyor' };
        }
        return { error: 'Malzeme oluşturulurken hata oluştu' };
    }

    // Log audit
    await supabase.from('audit_logs').insert({
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

    const materialData = {
        code: formData.get('code') as string,
        name: formData.get('name') as string,
        description: formData.get('description') as string || null,
        unit: formData.get('unit') as string,
        category: formData.get('category') as string || null,
        critical_level: parseFloat(formData.get('critical_level') as string) || 0,
        supplier_info: formData.get('supplier_info') as string || null,
        safety_info: formData.get('safety_info') as string || null,
        is_active: formData.get('is_active') === 'true',
    };

    if (!materialData.code || !materialData.name || !materialData.unit) {
        return { error: 'Lütfen tüm zorunlu alanları doldurun' };
    }

    const supabase = await createClient();

    // Get old data for audit
    const { data: oldData } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .single();

    // Update material
    const { data, error } = await supabase
        .from('materials')
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
    await supabase.from('audit_logs').insert({
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
        .from('materials')
        .select('is_active')
        .eq('id', materialId)
        .single();

    if (!material) {
        return { error: 'Malzeme bulunamadı' };
    }

    const newStatus = !material.is_active;

    // Update status
    const { error } = await supabase
        .from('materials')
        .update({
            is_active: newStatus,
            updated_at: new Date().toISOString(),
        })
        .eq('id', materialId);

    if (error) {
        return { error: 'Durum değiştirilirken hata oluştu' };
    }

    // Log audit
    await supabase.from('audit_logs').insert({
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
