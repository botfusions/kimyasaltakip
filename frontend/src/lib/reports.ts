import { createClient } from './supabase/server';

/**
 * Generates a CSV report for monthly usage based on production logs.
 * Includes detailed traceability (material, recipe, quantity).
 */
export async function generateMonthlyUsageCSV() {
    try {
        const supabase = await createClient();

        // 1. Fetch usage data with join
        // Same query as in the n8n template for consistency
        const { data, error } = await supabase.rpc('get_monthly_usage_report');

        // If RPC doesn't exist yet, we might need to handle it or use a raw query
        // For now, let's assume we implement the query logic here or use another migration

        const query = `
            SELECT 
                r.product_id, 
                p.code as product_code, 
                r.version_code, 
                m.code as material_code, 
                m.name as material_name,
                pm.actual_quantity, 
                pl.completed_at,
                pl.batch_number
            FROM recipes r 
            JOIN products p ON r.product_id = p.id 
            JOIN production_logs pl ON r.id = pl.recipe_id 
            JOIN production_materials pm ON pl.id = pm.production_log_id 
            JOIN materials m ON pm.material_id = m.id 
            WHERE pl.status = 'completed' 
            AND pl.completed_at >= (CURRENT_DATE - INTERVAL '1 month')
        `;

        // Note: Using postgrest for the join if possible, or we might need a stored procedure
        // Let's use a simpler select for now and refine if needed
        const { data: usageData, error: usageError } = await supabase
            .from('production_materials')
            .select(`
                actual_quantity,
                material:materials(code, name),
                production_log:production_logs(
                    completed_at,
                    batch_number,
                    recipe:recipes(
                        version_code,
                        product:products(code)
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
