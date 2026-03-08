const SUPABASE_URL = 'https://lsppsvspgpifuirzxqic.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcHBzdnNwZ3BpZnVpcnp4cWljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTkxNzQzOSwiZXhwIjoyMDY1NDkzNDM5fQ.15UoyVZkOlLxxjNNc7h73jEKOOa8enUab7X1gkyQ_4E';

async function checkImapSettings() {
    console.log('🔍 Checking IMAP settings...');
    const url = `${SUPABASE_URL}/rest/v1/kts_settings?key=ilike.GMAIL_IMAP_%`;
    try {
        const resp = await fetch(url, {
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`
            }
        });
        if (!resp.ok) {
            const errorText = await resp.text();
            console.error('❌ API Error:', resp.status, errorText);
            return;
        }
        const data = await resp.json();
        console.table(data.map(s => ({ key: s.key, value: s.key.includes('PASSWORD') ? '********' : s.value })));
    } catch (err) {
        console.error('❌ Fetch Error:', err.message);
    }
}

checkImapSettings();
