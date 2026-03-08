const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');
require('dotenv').config({ path: './frontend/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "", textNodeName: "_text" });

function getValue(node) {
    if (node === undefined || node === null) return null;
    if (typeof node === 'object') return node._text || node.content || node.value || "";
    return node;
}

function parseInvoiceXML(content) {
    try {
        const obj = xmlParser.parse(content);
        const invoice = obj['Invoice'] || obj['ubl:Invoice'] || obj;
        if (!invoice) return null;

        const id = getValue(invoice['cbc:ID'] || invoice['ID']);
        const issueDate = getValue(invoice['cbc:IssueDate'] || invoice['IssueDate']);
        const supplier = getValue(
            invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PartyName']?.['cbc:Name'] ||
            invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PartyLegalEntity']?.['cbc:RegistrationName'] ||
            invoice['AccountingSupplierParty']?.['Party']?.['PartyName']?.['Name']
        );
        
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

function normalizeCode(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9İığüşöç]/g, '').trim();
}

function normalizeString(str) {
    if (!str) return '';
    return str.toLowerCase().trim().replace(/[^a-z0-9İığüşöç\s]/g, '');
}

function matchMaterial(productCode, productName, materials) {
    const normalizedProductCode = normalizeCode(productCode);
    const normalizedProductName = normalizeString(productName);
    let bestMatch = { materialId: null, materialName: null, materialCode: null, confidence: 0 };

    for (const material of materials) {
        const normalizedMaterialCode = normalizeCode(material.stock_code);
        const normalizedMaterialName = normalizeString(material.name);

        if (normalizedProductCode !== '' && normalizedProductCode === normalizedMaterialCode) {
            return { materialId: material.id, materialName: material.name, materialCode: material.stock_code, confidence: 1.0 };
        }
        if (normalizedProductCode !== '' && normalizedMaterialCode !== '' &&
            (normalizedProductCode.includes(normalizedMaterialCode) || normalizedMaterialCode.includes(normalizedProductCode))) {
            if (0.8 > bestMatch.confidence) {
                bestMatch = { materialId: material.id, materialName: material.name, materialCode: material.stock_code, confidence: 0.8 };
            }
        }
        if (normalizedProductName && normalizedMaterialName &&
            (normalizedProductName.includes(normalizedMaterialName) || normalizedMaterialName.includes(normalizedProductName))) {
            if (0.6 > bestMatch.confidence) {
                bestMatch = { materialId: material.id, materialName: material.name, materialCode: material.stock_code, confidence: 0.6 };
            }
        }
    }
    return bestMatch;
}

async function reprocessAll() {
    const { data: invoices } = await supabase.from('kts_incoming_invoices').select('*').order('created_at', { ascending: false });
    const { data: materials } = await supabase.from('kts_materials').select('*');

    if (!invoices || !materials) { console.log('No data found.'); return; }
    console.log(`Found ${invoices.length} invoices and ${materials.length} materials.\n`);

    for (const inv of invoices) {
        if (!inv.attachment_content) { console.log(`[${inv.email_uid}] No attachment content, skip.`); continue; }

        console.log(`[UID:${inv.email_uid}] Reprocessing ${inv.invoice_number}...`);
        const parsedData = parseInvoiceXML(inv.attachment_content);
        
        if (!parsedData) { console.log(`  Parse failed.`); continue; }
        console.log(`  Parsed: ${parsedData.lines.length} line(s)`);

        // Run matching
        let matchedCount = 0;
        const matchResults = parsedData.lines.map(line => {
            const match = matchMaterial(line.productCode, line.productName, materials);
            if (match.materialId && match.confidence >= 0.6) matchedCount++;
            console.log(`  ${line.productCode} (${line.productName}) -> ${match.materialName || 'NOT FOUND'} (Conf: ${match.confidence})`);
            return { ...line, materialId: match.materialId, materialName: match.materialName, materialCode: match.materialCode, confidence: match.confidence, matched: match.materialId && match.confidence >= 0.6 };
        });

        // Update DB
        const { error } = await supabase.from('kts_incoming_invoices').update({
            parsed_data: parsedData,
            invoice_number: parsedData.invoiceNumber,
            supplier_name: parsedData.supplier,
            invoice_date: parsedData.invoiceDate,
            total_amount: parsedData.totalAmount,
            line_count: parsedData.lines.length,
            matched_count: matchedCount,
            match_result: matchResults,
            status: matchedCount > 0 ? 'matched' : 'processing'
        }).eq('id', inv.id);

        if (error) console.error(`  DB Error: ${error.message}`);
        else console.log(`  ✅ Updated. Matched: ${matchedCount}/${parsedData.lines.length}\n`);
    }
}

reprocessAll();
