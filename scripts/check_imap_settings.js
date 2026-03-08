const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
    const { data, error } = await supabase
        .from('kts_settings')
        .select('*')
        .ilike('key', 'GMAIL%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('IMAP Settings:');
    data.forEach(s => {
        if (s.key.includes('PASSWORD')) {
            console.log(`${s.key}: ********`);
        } else {
            console.log(`${s.key}: ${s.value}`);
        }
    });
    
    // Check if enabled
    const enabled = data.find(s => s.key === 'GMAIL_IMAP_ENABLED')?.value === 'true';
    if (!enabled) {
        console.log('\n⚠️ IMAP is DISABLED. Enabling it now for test...');
        await supabase.from('kts_settings').update({ value: 'true' }).eq('key', 'GMAIL_IMAP_ENABLED');
    }
}

checkSettings();
