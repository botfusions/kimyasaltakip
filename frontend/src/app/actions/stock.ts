'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';

/**
 * Kritik stok seviyesindeki malzemeleri getir
 */
export async function getCriticalStock() {
    try {
        const supabase = await createClient();

        // view_critical_stock görünümünü kullan
        const { data, error } = await supabase
            .from('view_critical_stock')
            .select('*')
            .order('stock_quantity', { ascending: true });

        if (error) {
            console.error('Kritik stok sorgusu hatası:', error);
            return { data: [], error: error.message };
        }

        return { data: data || [], error: null };
    } catch (error: any) {
        console.error('getCriticalStock hatası:', error);
        return { data: [], error: error.message };
    }
}

/**
 * Genel stok istatistiklerini getir
 */
export async function getStockStats() {
    try {
        const supabase = await createClient();

        // Toplam malzeme sayısı
        const { count: totalMaterials } = await supabase
            .from('materials')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        // Kritik stok sayısı
        const { count: criticalCount } = await supabase
            .from('view_critical_stock')
            .select('*', { count: 'exact', head: true });

        // Toplam stok değeri (stock tablosundan)
        const { data: stockData } = await supabase
            .from('stock')
            .select('quantity');

        const totalStockQuantity = stockData?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;

        return {
            data: {
                totalMaterials: totalMaterials || 0,
                criticalStockCount: criticalCount || 0,
                totalStockQuantity: Math.round(totalStockQuantity),
            },
            error: null,
        };
    } catch (error: any) {
        console.error('getStockStats hatası:', error);
        return {
            data: {
                totalMaterials: 0,
                criticalStockCount: 0,
                totalStockQuantity: 0,
            },
            error: error.message,
        };
    }
}

/**
 * Tüm stokları getir
 */
export async function getAllStock(filters?: {
    search?: string;
    category?: string;
    low_stock_only?: boolean;
}) {
    try {
        const supabase = await createClient();

        let query = supabase
            .from('stock')
            .select(`
                *,
                material:materials(
                    id,
                    code,
                    name,
                    unit,
                    category,
                    critical_level,
                    is_active
                )
            `)
            .order('material(name)', { ascending: true });

        const { data, error } = await query;

        if (error) {
            return { data: [], error: error.message };
        }

        let stocks = data || [];

        // Client-side filters
        if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            stocks = stocks.filter(
                (s: any) =>
                    s.material?.name?.toLowerCase().includes(searchLower) ||
                    s.material?.code?.toLowerCase().includes(searchLower)
            );
        }

        if (filters?.category) {
            stocks = stocks.filter((s: any) => s.material?.category === filters.category);
        }

        if (filters?.low_stock_only) {
            stocks = stocks.filter(
                (s: any) => s.quantity <= (s.material?.critical_level || 0)
            );
        }

        return { data: stocks, error: null };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
}

/**
 * Stok hareketi ekle (giriş/çıkış/düzeltme)
 */
export async function addStockMovement(formData: FormData) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || !['admin', 'warehouse'].includes(currentUser.role)) {
            return { error: 'Bu işlem için yetkiniz yok' };
        }

        const materialId = formData.get('material_id') as string;
        const movementType = formData.get('movement_type') as string;
        const quantity = parseFloat(formData.get('quantity') as string);
        const unitCost = formData.get('unit_cost')
            ? parseFloat(formData.get('unit_cost') as string)
            : null;
        const batchNumber = formData.get('batch_number') as string || null;
        const supplier = formData.get('supplier') as string || null;
        const notes = formData.get('notes') as string || null;

        if (!materialId || !movementType || !quantity) {
            return { error: 'Lütfen tüm zorunlu alanları doldurun' };
        }

        const supabase = await createClient();

        // 1. Stok hareketi kaydet
        const totalCost = unitCost ? quantity * unitCost : null;

        const { data: movement, error: movementError } = await supabase
            .from('stock_movements')
            .insert({
                material_id: materialId,
                movement_type: movementType,
                quantity: movementType === 'out' ? -quantity : quantity,
                unit_cost: unitCost,
                total_cost: totalCost,
                batch_number: batchNumber,
                supplier: supplier,
                notes: notes,
                created_by: currentUser.id,
            })
            .select()
            .single();

        if (movementError) {
            return { error: 'Stok hareketi kaydedilemedi' };
        }

        // 2. Stock tablosunu güncelle
        const { data: currentStock } = await supabase
            .from('stock')
            .select('quantity')
            .eq('material_id', materialId)
            .single();

        const currentQuantity = currentStock?.quantity || 0;
        const newQuantity = movementType === 'out'
            ? currentQuantity - quantity
            : currentQuantity + quantity;

        if (newQuantity < 0) {
            await supabase.from('stock_movements').delete().eq('id', movement.id);
            return { error: 'Stok miktarı negatif olamaz' };
        }

        const { error: stockError } = await supabase
            .from('stock')
            .upsert({
                material_id: materialId,
                quantity: newQuantity,
                last_movement_at: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                updated_by: currentUser.id,
            });

        if (stockError) {
            await supabase.from('stock_movements').delete().eq('id', movement.id);
            return { error: 'Stok güncellenemedi' };
        }

        revalidatePath('/dashboard/stock');

        return { success: true, data: movement };
    } catch (error: any) {
        return { error: error.message };
    }
}

/**
 * Stok hareketlerini getir
 */
export async function getStockMovements(materialId: string, limit = 50) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('stock_movements')
            .select(`
                *,
                created_by_user:users!stock_movements_created_by_fkey(id, name)
            `)
            .eq('material_id', materialId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            return { data: [], error: error.message };
        }

        return { data: data || [], error: null };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
}
