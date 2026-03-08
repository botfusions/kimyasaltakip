const { ImapFlow } = require('imapflow');
require('dotenv').config({ path: './frontend/.env.local' });

async function checkAllMailboxes() {
    console.log('--- Deep Mailbox Scan Started ---');
    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
            user: 'botsfatura@gmail.com',
            pass: 'uwzsxflwshzcacan'
        },
        tls: { rejectUnauthorized: false },
        logger: false,
    });

    try {
        await client.connect();
        const mailboxes = await client.list();
        console.log('Available Mailboxes:', mailboxes.map(m => m.path).join(', '));

        for (const mb of mailboxes) {
            const folderPath = mb.path;
            console.log(`\nAnalyzing folder: ${folderPath}`);
            
            let lock;
            try {
                lock = await client.getMailboxLock(folderPath);
                const status = await client.status(folderPath, { messages: true });
                if (status.messages > 0) {
                    console.log(`  Messages: ${status.messages}`);
                    const range = status.messages > 20 ? `${status.messages - 19}:*` : '1:*';
                    const messages = client.fetch(range, { envelope: true, uid: true });
                    
                    for await (const msg of messages) {
                        const subject = (msg.envelope.subject || '').toLowerCase();
                        if (msg.uid >= 10 || subject.includes('fatura') || subject.includes('rudolf')) {
                            console.log(`  UID: ${msg.uid} | From: ${msg.envelope.from[0].address} | Subject: ${msg.envelope.subject} | Date: ${msg.envelope.date.toISOString()}`);
                        }
                    }
                }
            } catch (folderErr) {
                console.log(`  Skip ${folderPath}: ${folderErr.message}`);
            } finally {
                if (lock) lock.release();
            }
        }
    } catch (err) {
        console.error('Connection Error:', err);
    } finally {
        await client.logout();
    }
}

checkAllMailboxes();
