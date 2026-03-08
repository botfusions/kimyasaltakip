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
                productCode: item?.['cac:SellersItemIdentification']?.['cbc:ID'] || item?.['SellersItemIdentification']?.['ID'],
                productName: item?.['cbc:Name'] || item?.['Name'],
                quantity: parseFloat(l['cbc:InvoicedQuantity'] || l['InvoicedQuantity']),
                unitPrice: parseFloat(l['cac:Price']?.['cbc:PriceAmount'] || l['Price']?.['PriceAmount']),
                totalAmount: parseFloat(l['cbc:LineExtensionAmount'] || l['LineExtensionAmount'])
            });
        });

        let totalAmount = invoice['cac:LegalMonetaryTotal']?.['cbc:PayableAmount'] || invoice['LegalMonetaryTotal']?.['PayableAmount'];
        if (typeof totalAmount === 'object') totalAmount = totalAmount['#text'] || totalAmount['content'] || totalAmount['value'];

        return {
            invoiceNumber: typeof id === 'object' ? id['#text'] : id,
            invoiceDate: typeof issueDate === 'object' ? issueDate['#text'] : issueDate,
            supplier: typeof supplier === 'object' ? supplier['#text'] : supplier,
            totalAmount: parseFloat(totalAmount),
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
    
    const isXml = filename.endsWith('.xml') || mime === 'text/xml' || mime === 'application/xml';
    const isPdf = filename.endsWith('.pdf') || mime === 'application/pdf';
    const isImg = filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.png') || mime.startsWith('image/');

    if ((isXml || isPdf || isImg) && part.part) {
        found.push({ 
            partId: part.part, 
            filename: filename || `file_${part.part}.${subtype === 'xml' ? 'xml' : subtype === 'pdf' ? 'pdf' : 'bin'}`,
            mime: mime
        });
    }

    if (part.childNodes) {
        part.childNodes.forEach(child => findAttachments(child, found));
    }
    return found;
}

async function runEnhancedFetch() {
    console.log('--- Enhanced Fetch Started ---');
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
            const sinceDate = new Date(); sinceDate.setDate(sinceDate.getDate() - 1);
            const messages = client.fetch({ since: sinceDate }, { envelope: true, uid: true, bodyStructure: true });

            for await (const msg of messages) {
                const uid = msg.uid;
                const subject = msg.envelope.subject || '';
                const lowerSubject = subject.toLowerCase();
                
                // Scan all recent messages to be sure
                console.log(`Checking UID:${uid} - "${subject}"`);
                
                const attachments = findAttachments(msg.bodyStructure);
                if (attachments.length === 0) continue;

                console.log(`   Found ${attachments.length} attachments.`);

                for (const att of attachments) {
                    console.log(`   Fetching ${att.filename}...`);
                    const partData = await client.fetchOne(uid.toString(), { bodyParts: [att.partId] }, { uid: true });
                    const buffer = partData.bodyParts.get(att.partId);
                    
                    let attachmentType = 'xml';
                    let attachmentContent = null;
                    if (att.filename.endsWith('.xml') || att.mime.includes('xml')) {
                        attachmentType = 'xml';
                        attachmentContent = buffer.toString('utf-8');
                    } else if (att.filename.endsWith('.pdf') || att.mime.includes('pdf')) {
                        attachmentType = 'pdf';
                    } else {
                        attachmentType = 'jpeg';
                    }
                    
                    let parsedData = null;
                    if (attachmentType === 'xml' && attachmentContent) {
                        parsedData = parseInvoiceXML(attachmentContent);
                        if (parsedData) console.log(`      ✅ Parsed successfully. Supplier: ${parsedData.supplier}`);
                    }

                    const { data, error } = await supabase.from('kts_incoming_invoices').upsert({
                        email_uid: uid.toString(),
                        email_from: msg.envelope.from[0]?.address || 'unknown',
                        email_subject: subject,
                        email_date: msg.envelope.date.toISOString(),
                        attachment_filename: att.filename,
                        attachment_type: attachmentType,
                        attachment_size: buffer.length,
                        attachment_content: attachmentContent,
                        parsed_data: parsedData,
                        invoice_number: parsedData?.invoiceNumber,
                        supplier_name: parsedData?.supplier,
                        invoice_date: parsedData?.invoiceDate,
                        total_amount: parsedData?.totalAmount,
                        status: parsedData ? 'matched' : 'pending'
                    }, { onConflict: 'email_uid,attachment_filename' }).select();

                    if (error) console.error(`   ❌ DB Error: ${error.message}`);
                    else console.log(`   ✅ Saved: ID ${data[0]?.id}`);
                }
            }
        } finally { lock.release(); }
    } catch (err) { console.error('Fetch error:', err); } finally { await client.logout(); }
}

runEnhancedFetch();
