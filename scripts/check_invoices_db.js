const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInvoices() {
    console.log('--- Checking Incoming Invoices ---');
    const { data, error } = await supabase
        .from('kts_incoming_invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data.length === 0) {
        console.log('No incoming invoices found in DB yet.');
        return;
    }

    data.forEach(inv => {
        console.log(`ID: ${inv.id}`);
        console.log(`Subject: ${inv.email_subject}`);
        console.log(`From: ${inv.email_from}`);
        console.log(`Status: ${inv.status}`);
        console.log(`Supplier: ${inv.supplier_name}`);
        console.log(`Match Count: ${inv.matched_count} / ${inv.line_count}`);
        console.log('---');
    });
}

checkInvoices();
