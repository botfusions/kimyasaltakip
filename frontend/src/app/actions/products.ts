'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';

/**
 * Check if current user has products management access (admin or lab)
 */
async function checkProductsAccess() {
    const currentUser = await getCurrentUser();

    if (!currentUser || !['admin', 'lab'].includes(currentUser.role)) {
        throw new Error('Bu işlem için yetkiniz yok');
    }

    return currentUser;
}

/**
 * Get all products with optional filters
 */
export async function getProducts(filters?: {
    type?: string;
    search?: string;
    is_active?: boolean;
}) {
    await checkProductsAccess();

    const supabase = await createClient();

    let query = supabase
        .from('products')
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
            error: 'Ürünler yüklenirken hata oluştu',
        };
    }

    return { data };
}

/**
 * Get single product by ID
 */
export async function getProductById(productId: string) {
    await checkProductsAccess();

    const supabase = await createClient();

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    if (error) {
        return { error: 'Ürün bulunamadı' };
    }

    return { data };
}

/**
 * Create new product (Admin or Lab only)
 */
export async function createProduct(formData: FormData) {
    const currentUser = await checkProductsAccess();

    const productData = {
        code: formData.get('code') as string,
        name: formData.get('name') as string,
        description: formData.get('description') as string || null,
        base_color: formData.get('base_color') as string || null,
        is_active: formData.get('is_active') === 'true',
    };

    // Validate required fields
    if (!productData.code || !productData.name) {
        return { error: 'Lütfen tüm zorunlu alanları doldurun' };
    }

    const supabase = await createClient();

    // Insert product
    const { data, error } = await supabase
        .from('products')
        .insert({
            ...productData,
            created_by: currentUser.id,
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') { // Unique violation
            return { error: 'Bu ürün kodu zaten kullanılıyor' };
        }
        return { error: 'Ürün oluşturulurken hata oluştu' };
    }

    // Log audit
    await supabase.from('audit_logs').insert({
        table_name: 'products',
        record_id: data.id,
        action: 'INSERT',
        user_id: currentUser.id,
        changes: { new: productData },
    });

    revalidatePath('/dashboard/products');

    return { success: true, data };
}

/**
 * Update existing product (Admin or Lab only)
 */
export async function updateProduct(productId: string, formData: FormData) {
    const currentUser = await checkProductsAccess();

    const productData = {
        code: formData.get('code') as string,
        name: formData.get('name') as string,
        description: formData.get('description') as string || null,
        base_color: formData.get('base_color') as string || null,
        is_active: formData.get('is_active') === 'true',
    };

    if (!productData.code || !productData.name) {
        return { error: 'Lütfen tüm zorunlu alanları doldurun' };
    }

    const supabase = await createClient();

    // Get old data for audit
    const { data: oldData } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    // Update product
    const { data, error } = await supabase
        .from('products')
        .update({
            ...productData,
            updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            return { error: 'Bu ürün kodu zaten kullanılıyor' };
        }
        return { error: 'Ürün güncellenirken hata oluştu' };
    }

    // Log audit
    await supabase.from('audit_logs').insert({
        table_name: 'products',
        record_id: productId,
        action: 'UPDATE',
        user_id: currentUser.id,
        changes: { old: oldData, new: productData },
    });

    revalidatePath('/dashboard/products');

    return { success: true, data };
}

/**
 * Toggle product active status (Admin or Lab only)
 */
export async function toggleProductStatus(productId: string) {
    const currentUser = await checkProductsAccess();

    const supabase = await createClient();

    // Get current status
    const { data: product } = await supabase
        .from('products')
        .select('is_active')
        .eq('id', productId)
        .single();

    if (!product) {
        return { error: 'Ürün bulunamadı' };
    }

    const newStatus = !product.is_active;

    // Update status
    const { error } = await supabase
        .from('products')
        .update({
            is_active: newStatus,
            updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

    if (error) {
        return { error: 'Durum değiştirilirken hata oluştu' };
    }

    // Log audit
    await supabase.from('audit_logs').insert({
        table_name: 'products',
        record_id: productId,
        action: 'UPDATE',
        user_id: currentUser.id,
        changes: {
            old: { is_active: product.is_active },
            new: { is_active: newStatus },
        },
    });

    revalidatePath('/dashboard/products');

    return { success: true };
}
