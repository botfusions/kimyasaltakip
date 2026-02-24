import { createAdminClient } from '@/lib/supabase/server';

/**
 * Generates a CSV report for monthly usage based on production logs.
 * Includes detailed traceability (material, recipe, quantity).
 */
export async function generateMonthlyUsageCSV() {
    try {
        const supabase = createAdminClient();

        // Fetch usage data using Supabase JS client
        const { data: usageData, error: usageError } = await supabase
            .from('kts_production_materials')
            .select(`
                actual_quantity,
                material:kts_materials(code, name),
                production_log:kts_production_logs(
                    completed_at,
                    batch_number,
                    recipe:kts_recipes(
                        version_code,
                        product:kts_products(code)
                    )
                )
            `)
            .gte('production_log.completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        if (usageError) throw usageError;

        // 2. Convert to CSV
        const headers = ['Tarih', 'Parti No', 'Ürün Kodu', 'Reçete Versiyon', 'Malzeme Kodu', 'Malzeme Adı', 'Miktar'];
        const rows = (usageData || []).map((item: any) => [
            new Date(item.production_log.completed_at).toLocaleDateString('tr-TR'),
            item.production_log.batch_number,
            item.production_log.recipe.product.code,
            item.production_log.recipe.version_code,
            item.material.code,
            item.material.name,
            item.actual_quantity
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

        return { success: true, csv: csvContent };

    } catch (error: any) {
        console.error('Error generating CSV report:', error);
        return { success: false, error: error.message };
    }
}
