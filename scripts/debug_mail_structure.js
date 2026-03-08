const { createClient } = require('@supabase/supabase-js');
const { ImapFlow } = require('imapflow');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMailStructure() {
    const { data: settings } = await supabase.from('kts_settings').select('*').ilike('key', 'GMAIL%');
    const config = settings.reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {});

    const client = new ImapFlow({
        host: 'imap.gmail.com', port: 993, secure: true,
        auth: { user: config['GMAIL_IMAP_USER'], pass: config['GMAIL_IMAP_PASSWORD'] },
        tls: { rejectUnauthorized: false }, logger: false,
    });

    try {
        await client.connect();
        let lock = await client.getMailboxLock('INBOX');
        try {
            const messages = client.fetch({ seq: '1:*' }, { envelope: true, uid: true, bodyStructure: true });
            let lastMsgs = [];
            for await (const msg of messages) {
                lastMsgs.push(msg);
            }
            
            // Look at the last 3
            const tail = lastMsgs.slice(-3);
            tail.forEach(msg => {
                console.log(`UID: ${msg.uid} | Subject: ${msg.envelope.subject}`);
                console.log('Structure:', JSON.stringify(msg.bodyStructure, null, 2));
            });
            
        } finally { lock.release(); }
    } catch (err) { console.error(err); } finally { await client.logout(); }
}

debugMailStructure();
