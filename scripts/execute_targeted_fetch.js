const { createClient } = require('@supabase/supabase-js');
const { ImapFlow } = require('imapflow');
const { XMLParser } = require('fast-xml-parser');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

function parseInvoiceXML(content) {
    try {
        const obj = xmlParser.parse(content);
        const invoice = obj['Invoice'] || obj['ubl:Invoice'] || obj;
        if (!invoice) return null;

        const id = invoice['cbc:ID'] || invoice['ID'];
        const issueDate = invoice['cbc:IssueDate'] || invoice['IssueDate'];
        const supplier = invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PartyName']?.['cbc:Name'] || 
                         invoice['AccountingSupplierParty']?.['Party']?.['PartyName']?.['Name'] ||
                         invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PartyLegalEntity']?.['cbc:RegistrationName'];
        
        let lines = [];
        const invoiceLines = invoice['cac:InvoiceLine'] || invoice['InvoiceLine'] || [];
        const lineArray = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];
        
        lineArray.forEach(l => {
            const item = l['cac:Item'] || l['Item'];
            lines.push({
                productCode: item?.['cac:SellersItemIdentification']?.['cbc:ID'] || item?.['SellersItemIdentification']?.['ID'] || '',
                productName: item?.['cbc:Name'] || item?.['Name'] || '',
                quantity: parseFloat(l['cbc:InvoicedQuantity'] || l['InvoicedQuantity'] || 0),
                unitPrice: parseFloat(l['cac:Price']?.['cbc:PriceAmount'] || l['Price']?.['PriceAmount'] || 0),
                totalAmount: parseFloat(l['cbc:LineExtensionAmount'] || l['LineExtensionAmount'] || 0)
            });
        });

        const payableAmtObj = invoice['cac:LegalMonetaryTotal']?.['cbc:PayableAmount'] || invoice['LegalMonetaryTotal']?.['PayableAmount'];
        let totalAmountVal = 0;
        if (payableAmtObj) {
            totalAmountVal = typeof payableAmtObj === 'object' ? (payableAmtObj['#text'] || payableAmtObj['content'] || 0) : payableAmtObj;
        }

        return {
            invoiceNumber: typeof id === 'object' ? (id['#text'] || id['content'] || '') : (id || ''),
            invoiceDate: typeof issueDate === 'object' ? (issueDate['#text'] || issueDate['content'] || '') : (issueDate || ''),
            supplier: typeof supplier === 'object' ? (supplier['#text'] || supplier['content'] || '') : (supplier || ''),
            totalAmount: parseFloat(totalAmountVal),
            lines: lines
        };
    } catch (e) {
        console.error('XML Parse Error:', e);
        return null;
    }
}

function findAttachments(part, found = []) {
    if (!part) return found;
    const type = (part.type || '').toLowerCase();
    const subtype = (part.subtype || '').toLowerCase();
    const mime = `${type}/${subtype}`;
    const filename = (part.disposition?.params?.filename || part.params?.name || '').toLowerCase();
    if ((filename.endsWith('.xml') || filename.endsWith('.pdf') || mime.includes('xml') || mime.includes('pdf')) && part.part) {
        found.push({ partId: part.part, filename, mime });
    }
    if (part.childNodes) part.childNodes.forEach(child => findAttachments(child, found));
    return found;
}

async function runTargetedFetch() {
    console.log('--- Targeted Fetch Started (UID 10+) ---');
    const { data: settings } = await supabase.from('kts_settings').select('*');
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
            // ONLY TARGET UID 10 AND 11
            const messages = client.fetch({ uid: '10:*' }, { envelope: true, uid: true, bodyStructure: true });

            for await (const msg of messages) {
                console.log(`Processing UID:${msg.uid} - "${msg.envelope.subject}"`);
                const attachments = findAttachments(msg.bodyStructure);
                
                for (const att of attachments) {
                    console.log(`   Found: ${att.filename}`);
                    let contentBuffer = Buffer.alloc(0);
                    const { content } = await client.download(msg.uid.toString(), att.partId, { uid: true });
                    for await (const chunk of content) { contentBuffer = Buffer.concat([contentBuffer, chunk]); }
                    
                    let attachmentType = (att.filename.endsWith('.pdf') || att.mime.includes('pdf')) ? 'pdf' : 'xml';
                    let attachmentContent = attachmentType === 'xml' ? contentBuffer.toString('utf-8') : null;
                    let parsedData = (attachmentType === 'xml') ? parseInvoiceXML(attachmentContent) : null;

                    const record = {
                        email_uid: msg.uid.toString(),
                        email_from: msg.envelope.from[0]?.address || 'unknown',
                        email_subject: msg.envelope.subject,
                        email_date: msg.envelope.date.toISOString(),
                        attachment_filename: att.filename,
                        attachment_type: attachmentType,
                        attachment_size: contentBuffer.length,
                        attachment_content: attachmentContent,
                        parsed_data: parsedData,
                        invoice_number: parsedData?.invoiceNumber || null,
                        supplier_name: parsedData?.supplier || null,
                        invoice_date: parsedData?.invoiceDate || null,
                        total_amount: parsedData?.totalAmount || 0,
                        status: parsedData ? 'matched' : 'pending'
                    };

                    const { data, error } = await supabase.from('kts_incoming_invoices').upsert(record, { onConflict: 'email_uid,attachment_filename' }).select();
                    if (error) console.error(`   ❌ DB Error: ${error.message}`);
                    else console.log(`   ✅ Saved: ID ${data[0].id}, Status: ${record.status}`);
                }
            }
        } finally { lock.release(); }
    } catch (err) { console.error('IMAP Error:', err); } finally { await client.logout(); }
}

runTargetedFetch();
