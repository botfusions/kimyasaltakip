import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase Service Key or URL');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSchema() {
    console.log('--- Fixing recipes table schema ---');

    const sql = `
    ALTER TABLE recipes 
    ADD COLUMN IF NOT EXISTS order_code TEXT,
    ADD COLUMN IF NOT EXISTS color_name TEXT,
    ADD COLUMN IF NOT EXISTS process_info TEXT,
    ADD COLUMN IF NOT EXISTS total_weight DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS machine_code TEXT,
    ADD COLUMN IF NOT EXISTS work_order_date DATE,
    ADD COLUMN IF NOT EXISTS bath_volume DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS customer_name TEXT,
    ADD COLUMN IF NOT EXISTS sip_no TEXT,
    ADD COLUMN IF NOT EXISTS customer_ref_no TEXT,
    ADD COLUMN IF NOT EXISTS customer_order_no TEXT,
    ADD COLUMN IF NOT EXISTS customer_sip_mt DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS yarn_type TEXT,
    ADD COLUMN IF NOT EXISTS lot_no TEXT,
    ADD COLUMN IF NOT EXISTS brand_name TEXT,
    ADD COLUMN IF NOT EXISTS c_cozg TEXT;
  `;

    // Note: createClient can't execute raw SQL easily unless using a special endpoint or rpc
    // But we can try to use a simple rpc if it exists, or just use the management API if we had it.
    // Actually, standard supabase-js doesn't have .sql().
    // Let's check if there's an 'exec_sql' rpc or similar.

    console.log('Attempting to execute ALTER TABLE via RPC (if exists)...');
    const { error } = await supabase.rpc('execute_sql', { sql_query: sql });

    if (error) {
        console.log('RPC execute_sql failed (likely not exists):', error.message);
        console.log('Trying to use fetch to call the REST API with Service Key (sometimes works for DDL if configured)');

        // Fallback: This usually won't work for DDL unless PostgREST is configured to allow it (unlikely)
        console.log('Please apply the migration manually or I will try to use the MCP helper if I can fix the connection.');
    } else {
        console.log('Schema fixed successfully!');
    }
}

fixSchema();
