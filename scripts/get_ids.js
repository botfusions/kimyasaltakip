
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '../frontend/.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        acc[key.trim()] = value.trim();
    }
    return acc;
}, {});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function getIds() {
    const { data: users } = await supabase.from('kts_users').select('id, name, role').limit(1);
    const { data: products } = await supabase.from('kts_products').select('id, name').limit(1);
    const { data: types } = await supabase.from('kts_usage_types').select('id, name').limit(1);

    console.log('Users:', JSON.stringify(users));
    console.log('Products:', JSON.stringify(products));
    console.log('Usage Types:', JSON.stringify(types));
}

getIds();
