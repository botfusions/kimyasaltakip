'use server';

import { createClient } from '@/lib/supabase/server';

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
