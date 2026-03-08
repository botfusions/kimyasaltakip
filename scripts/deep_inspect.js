const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepInspect() {
    // 1. Get the invoice
    const { data: inv } = await supabase
        .from('kts_incoming_invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    console.log('--- Invoice Details ---');
    console.log('Supplier:', inv.supplier_name);
    console.log('Lines:', JSON.stringify(inv.parsed_data.lines, null, 2));

    // 2. Get all materials
    const { data: materials } = await supabase
        .from('kts_materials')
        .select('id, name, stock_code');
    
    console.log('\n--- Existing Materials ---');
    materials.forEach(m => console.log(`Code: "${m.stock_code}", Name: "${m.name}"`));
}

deepInspect();
