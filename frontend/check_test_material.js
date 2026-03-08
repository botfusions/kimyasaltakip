const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMaterial() {
    const cas = '7439-92-1'; // Lead
    const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('cas_number', cas);

    if (error) {
        console.error('Error checking material:', error);
    } else {
        if (data.length > 0) {
            console.log('Material found:', data[0].name, data[0].code);
        } else {
            console.log('Material NOT found. Creating it...');
            const { data: newMat, error: createError } = await supabase
                .from('materials')
                .insert({
                    name: 'Test Lead Material',
                    code: 'MAT-LEAD',
                    cas_number: cas,
                    unit: 'kg',
                    critical_level: 10,
                    is_active: true
                })
                .select();

            if (createError) console.error('Error creating material:', createError);
            else console.log('Material created:', newMat[0].name);
        }
    }
}

checkMaterial();
