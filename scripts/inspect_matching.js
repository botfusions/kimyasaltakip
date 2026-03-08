const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectInvoiceAndMaterials() {
    // 1. Check Invoice Details
    const { data: inv, error: iErr } = await supabase
        .from('kts_incoming_invoices')
        .select('id, parsed_data')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    if (iErr) {
        console.error('Invoice Error:', iErr.message);
    } else {
        console.log('--- Last Invoice Lines ---');
        const lines = inv.parsed_data?.lines || [];
        lines.forEach(l => console.log(`- [${l.productCode}] ${l.productName} | Qty: ${l.quantity}`));
    }

    // 2. Check Materials Count
    const { count, error: cErr } = await supabase
        .from('kts_materials')
        .select('*', { count: 'exact', head: true });
    
    if (cErr) console.error('Materials Count Error:', cErr.message);
    else console.log(`\nTotal Materials in DB: ${count}`);
}

inspectInvoiceAndMaterials();
