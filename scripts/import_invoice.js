const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ADMIN_USER_ID = 'd0e61098-4a5f-4a15-ab3b-b9b4e1eae300';

async function importInvoice(invoiceId) {
    console.log(`--- Import Invoice ${invoiceId} ---`);

    // 1. Get invoice
    const { data: invoice, error: invErr } = await supabase
        .from('kts_incoming_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

    if (invErr || !invoice) { console.error('Invoice not found:', invErr?.message); return; }
    if (invoice.status === 'imported') { console.log('Already imported!'); return; }
    if (!invoice.match_result || !Array.isArray(invoice.match_result)) { console.log('No match_result!'); return; }

    console.log(`Invoice: ${invoice.invoice_number} | Status: ${invoice.status}`);
    console.log(`Lines: ${invoice.match_result.length}`);

    // 2. Create stock movements for matched lines
    let stockMovementsCreated = 0;
    const errors = [];

    for (const line of invoice.match_result) {
        if (!line.matched || !line.materialId) {
            console.log(`  SKIP: ${line.productName} (not matched)`);
            continue;
        }

        console.log(`  Processing: ${line.productName} (${line.quantity} units) -> ${line.materialName}`);

        // Create stock movement
        const { error: movementError } = await supabase.from('kts_stock_movements').insert({
            material_id: line.materialId,
            movement_type: 'in',
            quantity: line.quantity || 0,
            unit_cost: line.unitPrice || null,
            total_cost: line.totalAmount,
            batch_number: null,
            supplier: invoice.supplier_name,
            reference_type: 'invoice',
            reference_id: invoice.invoice_number,
            notes: `E-Fatura: ${invoice.invoice_number} - ${line.materialName || line.productName}`,
            created_by: ADMIN_USER_ID,
        });

        if (movementError) {
            console.error(`  ❌ Movement Error: ${movementError.message}`);
            errors.push(`${line.productName}: ${movementError.message}`);
            continue;
        }

        // Update stock quantity
        const { data: currentStock } = await supabase
            .from('kts_stock')
            .select('id, quantity')
            .eq('material_id', line.materialId)
            .single();

        const currentQuantity = currentStock?.quantity || 0;
        const newQuantity = currentQuantity + (line.quantity || 0);

        let stockErr;
        if (currentStock) {
            // Update existing stock record
            const res = await supabase.from('kts_stock').update({
                quantity: newQuantity,
                last_movement_at: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                updated_by: ADMIN_USER_ID,
            }).eq('id', currentStock.id);
            stockErr = res.error;
        } else {
            // Insert new stock record
            const res = await supabase.from('kts_stock').insert({
                material_id: line.materialId,
                quantity: newQuantity,
                last_movement_at: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                updated_by: ADMIN_USER_ID,
            });
            stockErr = res.error;
        }

        if (stockErr) {
            console.error(`  ❌ Stock Update Error: ${stockErr.message}`);
        } else {
            console.log(`  ✅ Stock updated: ${currentQuantity} -> ${newQuantity}`);
            stockMovementsCreated++;
        }
    }

    // 3. Update invoice status
    await supabase.from('kts_incoming_invoices').update({
        status: 'imported',
        imported_at: new Date().toISOString(),
        imported_by: ADMIN_USER_ID,
        import_notes: `${stockMovementsCreated} hareket oluşturuldu`,
    }).eq('id', invoiceId);

    console.log(`\n✅ Import complete: ${stockMovementsCreated} stock movements created.`);
}

// Import UID:11
importInvoice('750afd14-b03e-4c74-9df5-8209fda4bb25');
