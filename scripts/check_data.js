
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

async function checkRestricted() {
    console.log('Fetching restricted substances...');
    const { data, error } = await supabase
        .from('kts_restricted_substances')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Restricted Substances:', JSON.stringify(data, null, 2));

    console.log('Fetching materials...');
    const { data: materials, error: matError } = await supabase
        .from('kts_materials')
        .select('*')
        .limit(5);

    if (matError) {
        console.error('Error materials:', matError);
    }
    console.log('Materials:', JSON.stringify(materials, null, 2));
}

checkRestricted();
