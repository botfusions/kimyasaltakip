import { XMLParser } from 'fast-xml-parser';

export interface InvoiceLine {
    lineNumber: number;
    productCode: string;
    productName: string;
    quantity?: number;
    unitPrice?: number;
    totalAmount: number;
    currency: string;
    matchedMaterialId?: string;
    matchConfidence?: number;
}

export interface Invoice {
    invoiceNumber: string;
    invoiceDate?: string;
    supplier: string;
    supplierAddress?: string;
    buyer: string;
    buyerAddress?: string;
    currencyCode: string;
    totalAmount: number;
    lines: InvoiceLine[];
}

/**
 * Parse UBL-TR (Türkiye e-Fatura) XML format
 */
export function parseInvoiceXML(xmlContent: string): Invoice | null {
    try {
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
        });

        const result = parser.parse(xmlContent);
        const invoice = result.Invoice || result;

        // Extract invoice header info
        const invoiceNumber = invoice['cbc:ID'] || 'N/A';
        const invoiceDate = invoice['cbc:IssueDate'];

        // Extract supplier info (AccountingSupplierParty)
        const supplierParty = invoice['cac:AccountingSupplierParty']?.['cac:Party'];
        const supplierName = supplierParty?.['cac:PartyName']?.['cbc:Name'] || 'Bilinmiyor';
        const supplierAddress = supplierParty?.['cac:PostalAddress']?.['cbc:CityName'];

        // Extract buyer info (AccountingCustomerParty)
        const buyerParty = invoice['cac:AccountingCustomerParty']?.['cac:Party'];
        const buyerName = buyerParty?.['cac:PartyName']?.['cbc:Name'] || 'Bilinmiyor';
        const buyerAddress = buyerParty?.['cac:PostalAddress']?.['cbc:CityName'];

        // Extract currency and total amount
        const currencyCode = invoice['cbc:DocumentCurrencyCode'] || 'TRY';
        const totalAmount = parseFloat(
            invoice['cac:LegalMonetaryTotal']?.['cbc:PayableAmount'] || '0'
        );

        // Extract invoice lines
        let invoiceLines = invoice['cac:InvoiceLine'];
        if (!Array.isArray(invoiceLines)) {
            invoiceLines = invoiceLines ? [invoiceLines] : [];
        }

        const lines: InvoiceLine[] = invoiceLines.map((line: any) => {
            const lineNumber = parseInt(line['cbc:ID'] || '0');
            const productName = line['cac:Item']?.['cbc:Description'] || '';
            const productCode = line['cac:Item']?.['cbc:Name'] || '';
            const quantity = parseFloat(line['cbc:InvoicedQuantity'] || '0');
            const unitPrice = parseFloat(line['cac:Price']?.['cbc:PriceAmount'] || '0');
            const totalAmount = parseFloat(line['cbc:LineExtensionAmount'] || '0');
            const currency = line['cbc:LineExtensionAmount']?.['@_currencyID'] || currencyCode;

            return {
                lineNumber,
                productCode,
                productName,
                quantity,
                unitPrice,
                totalAmount,
                currency,
            };
        });

        return {
            invoiceNumber,
            invoiceDate,
            supplier: supplierName,
            supplierAddress,
            buyer: buyerName,
            buyerAddress,
            currencyCode,
            totalAmount,
            lines,
        };
    } catch (error) {
        console.error('XML parsing error:', error);
        return null;
    }
}

/**
 * Match invoice line product code with materials in database
 * Uses fuzzy matching for better accuracy
 */
export function matchMaterial(
    productCode: string,
    productName: string,
    materials: Array<{ id: string; code: string; name: string }>
): { materialId: string | null; confidence: number } {
    if (!materials || materials.length === 0) {
        return { materialId: null, confidence: 0 };
    }

    // Normalize strings for comparison
    const normalizeString = (str: string) =>
        str
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]/g, '');

    const normalizedProductCode = normalizeString(productCode);
    const normalizedProductName = normalizeString(productName);

    let bestMatch: { materialId: string | null; confidence: number } = {
        materialId: null,
        confidence: 0,
    };

    for (const material of materials) {
        const normalizedMaterialCode = normalizeString(material.code);
        const normalizedMaterialName = normalizeString(material.name);

        // Exact code match = 100% confidence
        if (normalizedProductCode === normalizedMaterialCode) {
            return { materialId: material.id, confidence: 1.0 };
        }

        // Partial code match
        if (
            normalizedProductCode.includes(normalizedMaterialCode) ||
            normalizedMaterialCode.includes(normalizedProductCode)
        ) {
            const confidence = 0.8;
            if (confidence > bestMatch.confidence) {
                bestMatch = { materialId: material.id, confidence };
            }
        }

        // Name similarity (simple substring match)
        if (normalizedProductName && normalizedMaterialName) {
            if (normalizedProductName.includes(normalizedMaterialName)) {
                const confidence = 0.6;
                if (confidence > bestMatch.confidence) {
                    bestMatch = { materialId: material.id, confidence };
                }
            }
        }
    }

    return bestMatch;
}

/**
 * Parse OCR text from PDF/JPEG invoice
 * Extracts invoice information using regex patterns
 */
export function parseOCRText(ocrText: string): Invoice | null {
    try {
        const lines = ocrText.split('\n').filter(line => line.trim());

        // Extract invoice number
        let invoiceNumber = 'N/A';
        const invoiceNoPatterns = [
            /(?:fatura|FATURA|İrsaliye|IRSALIYE)\s*(?:no|NO|No)?\s*:?\s*([A-Z0-9-]+)/i,
            /([A-Z]{3}\d{13,})/,
        ];

        for (const pattern of invoiceNoPatterns) {
            const match = ocrText.match(pattern);
            if (match) {
                invoiceNumber = match[1];
                break;
            }
        }

        // Extract date
        const datePattern = /(\d{2}[./-]\d{2}[./-]\d{4})/;
        const dateMatch = ocrText.match(datePattern);
        const invoiceDate = dateMatch ? dateMatch[1].replace(/[/-]/g, '.') : undefined;

        // Extract supplier (usually in first few lines)
        let supplier = 'Bilinmiyor';
        const supplierPatterns = [
            /([A-ZİĞÜŞÖÇ][A-ZİĞÜŞÖÇa-zığüşöç\s]+(?:A\.Ş\.|LTD\.|SAN\.|TİC\.|KİMYA|TEKSTİL))/,
            /Tedarikçi\s*:?\s*(.+)/i,
        ];

        for (const pattern of supplierPatterns) {
            const match = ocrText.match(pattern);
            if (match) {
                supplier = match[1].trim();
                break;
            }
        }

        // Extract total amount
        let totalAmount = 0;
        const totalPatterns = [
            /(?:toplam|TOPLAM|Genel Toplam|GENEL TOPLAM)\s*:?\s*([\d.,]+)/i,
            /Ödenecek Tutar\s*:?\s*([\d.,]+)/i,
        ];

        for (const pattern of totalPatterns) {
            const match = ocrText.match(pattern);
            if (match) {
                totalAmount = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
                break;
            }
        }

        // Extract product lines (simple pattern matching)
        const productLines: InvoiceLine[] = [];
        let lineNumber = 1;

        // Look for lines with product codes (usually alphanumeric codes)
        const productCodePattern = /([A-Z0-9-]{4,})\s+(.{10,}?)\s+([\d.,]+)\s+([\d.,]+)/g;
        let match;

        while ((match = productCodePattern.exec(ocrText)) !== null) {
            const [, code, name, quantity, amount] = match;

            productLines.push({
                lineNumber: lineNumber++,
                productCode: code.trim(),
                productName: name.trim(),
                quantity: parseFloat(quantity.replace(',', '.')),
                totalAmount: parseFloat(amount.replace(/\./g, '').replace(',', '.')),
                currency: 'TRY',
            });
        }

        // If no products found, try simpler pattern
        if (productLines.length === 0) {
            const simplePattern = /([A-Z0-9]{5,})\s+([A-ZİĞÜŞÖÇa-zığüşöç\s-]{10,})/g;
            while ((match = simplePattern.exec(ocrText)) !== null) {
                productLines.push({
                    lineNumber: lineNumber++,
                    productCode: match[1].trim(),
                    productName: match[2].trim(),
                    totalAmount: 0,
                    currency: 'TRY',
                });
            }
        }

        return {
            invoiceNumber,
            invoiceDate,
            supplier,
            buyer: 'DENİZLİ RATEKS TEKSTİL',
            currencyCode: 'TRY',
            totalAmount,
            lines: productLines,
        };
    } catch (error) {
        console.error('OCR text parsing error:', error);
        return null;
    }
}

/**
 * Calculate Levenshtein distance for string similarity
 */
function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}
