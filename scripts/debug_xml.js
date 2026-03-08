const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugXmlAndMaterials() {
    // 1. Get the invoice XML
    const { data: inv } = await supabase
        .from('kts_incoming_invoices')
        .select('attachment_content')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    if (inv?.attachment_content) {
        console.log('--- XML CONTENT (FIRST 2000 CHARS) ---');
        console.log(inv.attachment_content.substring(0, 2000));
        console.log('\n--- SEARCHING FOR LOOPS ---');
        const start = inv.attachment_content.indexOf('<cac:InvoiceLine>');
        if (start !== -1) {
            console.log(inv.attachment_content.substring(start, start + 2000));
        }
    }

    // 2. Check materials again
    const { data: materials, error } = await supabase.from('kts_materials').select('*');
    if (error) console.error('Materials Error:', error.message);
    else console.log(`\nMaterials found: ${materials?.length || 0}`);
}

debugXmlAndMaterials();
