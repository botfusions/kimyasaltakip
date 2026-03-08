const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMaterials() {
    const { data, error } = await supabase.from('kts_materials').select('id, name, stock_code').limit(10);
    if (error) {
        console.error('Error:', error.message);
        return;
    }
    console.log('--- Materials (First 10) ---');
    data.forEach(m => console.log(`${m.stock_code}: ${m.name}`));
}

checkMaterials();
