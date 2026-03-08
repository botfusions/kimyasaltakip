const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyRls() {
    console.log('Fetching RLS Policies from pg_policies...');
    
    // We can query pg_policies via RPC or raw SQL if we have a function, 
    // but since we don't have a specific RPC, we'll try to check by performing non-admin actions 
    // OR we can try to query pg_catalog if permissions allow (usually not for anon/service_role via API).
    // Alternative: Try to see if we can read as 'anon'
    
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const tables = ['kts_materials', 'kts_recipes', 'kts_stock'];
    for (const table of tables) {
        const { data, error } = await anonClient.from(table).select('id').limit(1);
        if (error) {
            console.log(`📡 ${table} (anon): BLOCKED (${error.message}) - Expected if RLS is on and no public access`);
        } else {
            console.log(`📡 ${table} (anon): ACCESSIBLE - Warning: Public access enabled?`);
        }
    }
}

verifyRls();
