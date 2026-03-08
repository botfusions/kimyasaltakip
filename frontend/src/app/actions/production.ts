'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';

/**
 * Get all production logs with recipe and product details
 */
export async function getProductionLogs() {
    try {
        const supabase = await createClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Yetkisiz erişim');
        }

        const { data, error } = await supabase
            .from('kts_production_logs')
            .select(`
                *,
                recipe:kts_recipes(
                    id,
                    version,
                    product:kts_products(name, code)
                ),
                operator:kts_users!operator_id(name),
                supervisor:kts_users!supervisor_id(name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('getProductionLogs error:', error);
            throw error;
        }

        return { data, error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

/**
 * Get production log by ID
 */
export async function getProductionById(id: string) {
    try {
        const supabase = await createClient();
        const user = await getCurrentUser();

        if (!user) {
            throw new Error('Yetkisiz erişim');
        }

        const { data, error } = await supabase
            .from('kts_production_logs')
            .select(`
                *,
                recipe:kts_recipes(
                    id,
                    version_code,
                    product:kts_products(name, code)
                ),
                materials:kts_production_materials(
                    *,
                    material:kts_materials(id, name, code)
                ),
                operator:kts_users!operator_id(name),
                supervisor:kts_users!supervisor_id(name)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

/**
 * Update production status
 */
export async function updateProductionStatus(id: string, status: string) {
    try {
        const supabase = await createClient();
        const user = await getCurrentUser();

        if (!user || (user.role !== 'admin' && user.role !== 'production' && user.role !== 'lab')) {
             throw new Error('Bu işlem için yetkiniz yok.');
        }

        // Get old data for audit
        const { data: oldLog } = await supabase
            .from('kts_production_logs')
            .select('status')
            .eq('id', id)
            .single();

        const updateData: any = { 
            status,
            updated_at: new Date().toISOString()
        };
        
        if (status === 'in_progress') {
            updateData.started_at = new Date().toISOString();
        } else if (status === 'completed') {
            updateData.completed_at = new Date().toISOString();
        }

        const { error } = await supabase
            .from('kts_production_logs')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;

        // Log audit
        await supabase.from('kts_audit_logs').insert({
            table_name: 'production_logs',
            record_id: id,
            action: 'UPDATE',
            user_id: user.id,
            changes: { 
                old: { status: oldLog?.status }, 
                new: { status: status } 
            },
        });

        revalidatePath('/dashboard/production');
        revalidatePath(`/dashboard/production/${id}`);
        
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Delete production log (Admin only)
 */
export async function deleteProductionLog(id: string) {
    try {
        const supabase = await createClient();
        const user = await getCurrentUser();

        if (!user || user.role !== 'admin') {
            throw new Error('Bu işlem için sadece yöneticiler yetkilidir.');
        }

        const { error } = await supabase
            .from('kts_production_logs')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Log audit
        await supabase.from('kts_audit_logs').insert({
            table_name: 'production_logs',
            record_id: id,
            action: 'DELETE',
            user_id: user.id,
            changes: { deleted: true },
        });

        revalidatePath('/dashboard/production');
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
