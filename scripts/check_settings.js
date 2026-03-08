const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkKtsSettings() {
    const { data, error } = await supabase.from('kts_settings').select('*');
    if (error) {
        console.error('Error:', error.message);
        return;
    }
    console.log('--- Current Settings ---');
    data.forEach(s => console.log(`${s.key}: ${s.value}`));
}

checkKtsSettings();
