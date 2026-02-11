const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');
const { execSync } = require('child_process');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lsppsvspgpifuirzxqic.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID; // Passed from env

const supabase = SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
    : null;

if (!supabase) {
    console.log('NOTICE: SUPABASE_SERVICE_ROLE_KEY not provided. Running in DRY-RUN mode (Extraction only).');
}

// --- Logic from lib/invoice-parser.ts (Simplified/Adapted) ---

function parseInvoiceXML(xmlContent) {
    try {
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
        const result = parser.parse(xmlContent);
        const invoice = result.Invoice || result;

        const invoiceNumber = invoice['cbc:ID'] || 'N/A';
        const invoiceDate = invoice['cbc:IssueDate']; // YYYY-MM-DD
        const supplierName = invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PartyName']?.['cbc:Name'] || 'Bilinmiyor';
        const totalAmount = parseFloat(invoice['cac:LegalMonetaryTotal']?.['cbc:PayableAmount'] || '0');
        const currencyCode = invoice['cbc:DocumentCurrencyCode'] || 'TRY';

        let invoiceLines = invoice['cac:InvoiceLine'];
        if (!Array.isArray(invoiceLines)) invoiceLines = invoiceLines ? [invoiceLines] : [];

        const lines = invoiceLines.map(line => ({
            productCode: line['cac:Item']?.['cbc:Name'] || '',
            productName: line['cac:Item']?.['cbc:Description'] || '',
            quantity: parseFloat(line['cbc:InvoicedQuantity'] || '0'),
            unitPrice: parseFloat(line['cac:Price']?.['cbc:PriceAmount'] || '0'),
            totalAmount: parseFloat(line['cbc:LineExtensionAmount'] || '0'),
            currency: line['cbc:LineExtensionAmount']?.['@_currencyID'] || currencyCode
        }));

        return { invoiceNumber, invoiceDate, supplier: supplierName, totalAmount, lines, currencyCode };
    } catch (e) {
        console.error('XML Parse Error:', e);
        return null;
    }
}

function parseOCRText(ocrText) {
    try {
        const lines = ocrText.split('\n').filter(l => l.trim());
        let invoiceNumber = 'OCR-INV-' + Date.now(); // Fallback

        // Try to find Invoice/Waybill Number
        const invMatch = ocrText.match(/(?:fatura|FATURA|irsaliye|İRSALİYE|IRSALIYE)\s*(?:no|NO)?\s*:?\s*([A-Z0-9-]{10,})/i) || ocrText.match(/([A-Z]{3}\d{13,})/);
        if (invMatch) invoiceNumber = invMatch[1];

        // Try to find Date
        const dateMatch = ocrText.match(/(\d{2}[./-]\d{2}[./-]\d{4})/);
        const invoiceDate = dateMatch ? dateMatch[1].replace(/[/-]/g, '.') : new Date().toISOString().split('T')[0];

        // Try to find Supplier
        const supplierMatch = ocrText.match(/([A-ZİĞÜŞÖÇ][A-ZİĞÜŞÖÇa-zığüşöç\s]+(?:A\.Ş\.|LTD\.|SAN\.|TİC\.|KİMYA|TEKSTİL))/);
        const supplier = supplierMatch ? supplierMatch[1].trim() : 'OCR Supplier';

        // Try to find Total
        const totalMatch = ocrText.match(/(?:toplam|TOPLAM)\s*:?\s*([\d.,]+)/i);
        const totalAmount = totalMatch ? parseFloat(totalMatch[1].replace(/\./g, '').replace(',', '.')) : 0;

        // Extract lines (Simple Logic)
        const productLines = [];
        // Pattern: Code Name Qty Amount (Relaxed)
        // Try to find lines that end with numbers like Amount (1.234,56)
        // Example: 25-0035 TEKSTIL KIMYASALI 1.000 KG 10.000,00
        const pattern = /([A-Z0-9-]{3,})\s+(.+?)\s+([\d.,]+)\s*(?:KG|kg|ADET|adt|L|lt)?\s+([\d.,]+)/g;
        let match;
        let lineNo = 1;
        while ((match = pattern.exec(ocrText)) !== null) {
            productLines.push({
                lineNumber: lineNo++,
                productCode: match[1].trim(),
                productName: match[2].trim(),
                quantity: parseFloat(match[3].replace(',', '.')),
                totalAmount: parseFloat(match[4].replace(/\./g, '').replace(',', '.')),
                unitPrice: 0, // Calculated later if needed
                currency: 'TRY'
            });
        }

        return { invoiceNumber, invoiceDate, supplier, totalAmount, lines: productLines, currencyCode: 'TRY' };
    } catch (e) {
        console.error('OCR Parse Error:', e);
        return null;
    }
}

// Simplified matching (exact code match only for this script to be safe)
async function getMaterials() {
    const { data, error } = await supabase.from('materials').select('id, code, name');
    if (error) throw error;
    return data;
}

function matchMaterial(line, materials) {
    const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const pCode = norm(line.productCode);
    const pName = norm(line.productName);

    for (const m of materials) {
        const mCode = norm(m.code);
        const mName = norm(m.name);
        if (pCode && mCode && pCode === mCode) return { id: m.id, confidence: 1 };
        if (pName && mName && pName.includes(mName)) return { id: m.id, confidence: 0.8 };
    }
    return { id: null, confidence: 0 };
}

// --- Main Process ---

const sqlStatements = [
    "-- Generated SQL for Invoice Import",
    "-- Run this in Supabase SQL Editor",
    ""
];

async function processFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`Processing: ${fileName}`);

    let invoiceData = null;

    try {
        const ext = path.extname(filePath).toLowerCase();

        if (ext === '.xml') {
            const content = fs.readFileSync(filePath, 'utf-8');
            invoiceData = parseInvoiceXML(content);
        } else if (['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
            // Call Python OCR
            try {
                console.log('Running OCR...');
                // ocr_invoice.py is in project root, script is in frontend/scripts
                const ocrScriptPath = path.join(__dirname, '../../ocr_invoice.py');
                const ocrText = execSync(`python "${ocrScriptPath}" "${filePath}"`, { encoding: 'utf-8' });
                console.log("OCR Output:", ocrText); // Debug
                invoiceData = parseOCRText(ocrText);

                // Add note about raw text
                if (invoiceData) invoiceData.notes = "OCR ile okundu.";
            } catch (e) {
                console.error('OCR Failed:', e.message);
                return { success: false, error: 'OCR processing failed' };
            }
        }

        if (!invoiceData || !invoiceData.lines.length) {
            console.error('Failed to extract invoice data or lines.');
            return { success: false, error: 'No data extracted' };
        }

        console.log(`Extracted Invoice: ${invoiceData.invoiceNumber} from ${invoiceData.supplier}`);
        console.log(`Found ${invoiceData.lines.length} lines.`);

        // SQL Generation Logic
        if (invoiceData && invoiceData.lines && invoiceData.lines.length > 0) {
            const supplierName = invoiceData.invoiceNumber.startsWith('OCR') ? 'Bilinmeyen Tedarikçi' : 'RUDOLF DURANER KİMYEVİ MADDELER TİC. ve SAN. A.Ş.'; // Hardcoded for example

            invoiceData.lines.forEach(line => {
                if (!line.productCode) return;

                // 1. Insert Material (if not exists)
                // Use COALESCE/CASE for safe string escaping in real app, here simple regex
                const cleanName = (line.productName || 'Bilinmeyen Ürün').replace(/'/g, "''");
                const cleanCode = line.productCode.replace(/'/g, "''");

                sqlStatements.push(`
-- Material: ${cleanCode}
INSERT INTO materials (code, name, unit, category, is_active, critical_level)
VALUES ('${cleanCode}', '${cleanName}', 'kg', 'Kimyasal', true, 100)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
`);

                // 2. Insert Stock Movement
                if (line.quantity) {
                    sqlStatements.push(`
-- Stock Movement for ${cleanCode}
INSERT INTO stock_movements (
    material_id, 
    movement_type, 
    quantity, 
    supplier, 
    created_by,
    notes
)
VALUES (
    (SELECT id FROM materials WHERE code = '${cleanCode}' LIMIT 1), 
    'in', 
    ${line.quantity}, 
    '${supplierName}', 
    (SELECT id FROM users ORDER BY created_at ASC LIMIT 1), 
    'Fatura: ${invoiceData.invoiceNumber}'
);
`);
                }
            });
        }

        return { success: true, invoice: invoiceData, sqlGenerated: true };

    } catch (error) {
        console.error(`Error processing ${fileName}:`, error);
        return { success: false, error: error.message };
    }
}

(async () => {
    // Process 2 example files
    const files = [
        path.join(__dirname, '../../fatura/RUD2025000017302-D5366353-0A32-44C1-95E8-DCDE9EF5755C.xml'),
        // path.join(__dirname, '../../fatura/7350213672_RUD2025000023792.pdf') // Takes longer, sticking to XML + One Image/PDF
        path.join(__dirname, '../../fatura/IMG-20260204-WA0000.jpg')
    ];

    const results = [];
    for (const f of files) {
        if (fs.existsSync(f)) {
            const res = await processFile(f);
            results.push({ file: path.basename(f), result: res });
        } else {
            console.error(`File not found: ${f}`);
        }
    }

    // After loop, write SQL statements to file
    const sqlContent = sqlStatements.join('\n');
    const outputPath = path.join(__dirname, 'invoice_import.sql');
    fs.writeFileSync(outputPath, sqlContent);
    console.log(`SQL file generated at: ${outputPath}`);
    console.log(JSON.stringify(results, null, 2));
})();
