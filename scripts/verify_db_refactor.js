
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars manually since we are in a script
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
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
    console.log('Verifying table access with kts_ prefix...');

    // Check kts_users
    const { count: userCount, error: userError } = await supabase
        .from('kts_users')
        .select('*', { count: 'exact', head: true });

    if (userError) {
        console.error('Error accessing kts_users:', userError);
    } else {
        console.log(`Success: Found ${userCount} records in kts_users`);
    }

    // Check kts_materials
    const { count: materialCount, error: materialError } = await supabase
        .from('kts_materials')
        .select('*', { count: 'exact', head: true });

    if (materialError) {
        console.error('Error accessing kts_materials:', materialError);
    } else {
        console.log(`Success: Found ${materialCount} records in kts_materials`);
    }

    // Check old table name to ensure it fails or is empty (if not renamed but copied)
    // Actually if renamed it should error 404 or similar from API if mapped to nothing, 
    // but in Supabase it typically returns error if table doesn't exist
    const { error: oldTableError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    if (oldTableError) {
        console.log('Confirmed: Old "users" table is not accessible (Expected). Error:', oldTableError.message);
    } else {
        console.warn('Warning: Old "users" table IS still accessible.');
    }
}

verifyTables();
