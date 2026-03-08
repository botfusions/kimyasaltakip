const { createClient } = require('@supabase/supabase-js');
const { ImapFlow } = require('imapflow');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runFetch() {
    console.log('--- Fetching IMAP Settings ---');
    const { data: settings, error } = await supabase
        .from('kts_settings')
        .select('*')
        .ilike('key', 'GMAIL%');

    if (error) {
        console.error('Settings error:', error);
        return;
    }

    const config = settings.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
    }, {});

    if (config['GMAIL_IMAP_ENABLED'] !== 'true') {
        console.error('IMAP IS DISABLED');
        return;
    }

    console.log(`Connecting to IMAP as ${config['GMAIL_IMAP_USER']}...`);

    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
            user: config['GMAIL_IMAP_USER'],
            pass: config['GMAIL_IMAP_PASSWORD'],
        },
        tls: { rejectUnauthorized: false },
        logger: false,
    });

    try {
        await client.connect();
        console.log('✅ Connected to Gmail');

        let lock = await client.getMailboxLock('INBOX');
        try {
            // Search criteria: since yesterday
            const sinceDate = new Date();
            sinceDate.setDate(sinceDate.getDate() - 1);
            
            console.log(`Searching messages since ${sinceDate.toISOString()}...`);
            
            const messages = client.fetch({ since: sinceDate }, {
                envelope: true,
                uid: true,
                bodyStructure: true
            });

            let foundCount = 0;
            for await (const msg of messages) {
                const subject = msg.envelope.subject || '';
                const from = msg.envelope.from[0]?.address || 'unknown';
                const date = msg.envelope.date;
                
                console.log(`Found: [${msg.uid}] "${subject}" from ${from} at ${date}`);
                
                const lowerSubject = subject.toLowerCase();
                if (lowerSubject.includes('fatura') || lowerSubject.includes('invoice') || lowerSubject.includes('bilgi')) {
                    console.log('   ⭐ Potential matching email!');
                    foundCount++;
                    // In a real run, here we would fetch parts and save to DB
                    // For now, let's just confirm it's there
                }
            }
            
            console.log(`--- Scan Complete. Found ${foundCount} relevant emails. ---`);
            console.log('Please check kts_email_fetch_log or kts_incoming_invoices in DB to see if frontend picked it up.');
            
        } finally {
            lock.release();
        }
    } catch (err) {
        console.error('Fetch error:', err);
    } finally {
        await client.logout();
    }
}

runFetch();
