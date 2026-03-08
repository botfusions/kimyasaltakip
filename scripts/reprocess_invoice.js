const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const xmlParser = new XMLParser({ 
    ignoreAttributes: false, 
    attributeNamePrefix: "",
    textNodeName: "_text"
});

function getValue(node) {
    if (node === undefined || node === null) return null;
    if (typeof node === 'object') {
        return node._text || node.content || node.value || "";
    }
    return node;
}

function parseInvoiceXML(content) {
    try {
        const obj = xmlParser.parse(content);
        const invoice = obj['Invoice'] || obj['ubl:Invoice'] || obj;
        if (!invoice) return null;

        const id = getValue(invoice['cbc:ID'] || invoice['ID']);
        const issueDate = getValue(invoice['cbc:IssueDate'] || invoice['IssueDate']);
        const supplier = getValue(invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PartyName']?.['cbc:Name'] || 
                         invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PartyLegalEntity']?.['cbc:RegistrationName'] ||
                         invoice['AccountingSupplierParty']?.['Party']?.['PartyName']?.['Name']);
        
        let lines = [];
        const invoiceLines = invoice['cac:InvoiceLine'] || invoice['InvoiceLine'] || [];
        const lineArray = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];
        
        lineArray.forEach(l => {
            const item = l['cac:Item'] || l['Item'];
            lines.push({
                productCode: getValue(item?.['cac:SellersItemIdentification']?.['cbc:ID'] || item?.['SellersItemIdentification']?.['ID'] || item?.['cbc:Name']),
                productName: getValue(item?.['cbc:Description'] || item?.['Description'] || item?.['cbc:Name']),
                quantity: parseFloat(getValue(l['cbc:InvoicedQuantity'] || l['InvoicedQuantity']) || 0),
                unitPrice: parseFloat(getValue(l['cac:Price']?.['cbc:PriceAmount'] || l['Price']?.['PriceAmount']) || 0),
                totalAmount: parseFloat(getValue(l['cbc:LineExtensionAmount'] || l['LineExtensionAmount']) || 0)
            });
        });

        const payableAmt = invoice['cac:LegalMonetaryTotal']?.['cbc:PayableAmount'] || invoice['LegalMonetaryTotal']?.['PayableAmount'];
        
        return {
            invoiceNumber: id,
            invoiceDate: issueDate,
            supplier: supplier,
            totalAmount: parseFloat(getValue(payableAmt) || 0),
            lines: lines
        };
    } catch (e) {
        console.error('XML Parse Error:', e);
        return null;
    }
}

async function reprocessLastInvoice() {
    const { data: inv } = await supabase
        .from('kts_incoming_invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    if (!inv || !inv.attachment_content) {
        console.log('No invoice to reprocess.');
        return;
    }

    console.log(`Reprocessing ID: ${inv.id}...`);
    const parsedData = parseInvoiceXML(inv.attachment_content);
    
    if (parsedData) {
        console.log('Parsed successfully:', parsedData.lines.length, 'lines found.');
        console.log('Sample Line:', parsedData.lines[0]);

        const { error } = await supabase
            .from('kts_incoming_invoices')
            .update({
                parsed_data: parsedData,
                invoice_number: parsedData.invoiceNumber,
                supplier_name: parsedData.supplier,
                invoice_date: parsedData.invoiceDate,
                total_amount: parsedData.totalAmount,
                line_count: parsedData.lines.length,
                status: 'matched' // Temporary set to matched for testing UI
            })
            .eq('id', inv.id);

        if (error) console.error('Update Error:', error.message);
        else console.log('Successfully updated DB.');
    } else {
        console.log('Parsing failed.');
    }
}

reprocessLastInvoice();
