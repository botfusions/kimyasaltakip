import { XMLParser } from 'fast-xml-parser';
import { Invoice, InvoiceLine } from '../invoice-parser';

/**
 * Service to parse UBL-TR (Türkiye e-Fatura) XML format
 */
export class XmlInvoiceParser {
    static parse(xmlContent: string): Invoice | null {
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
                const item = line['cac:Item'] || {};
                
                // Name often contains the product name or mixed name/code in UBL-TR
                const name = item['cbc:Name'] || '';
                // Description often contains detailed names or additional info like "25-0035"
                const description = item['cbc:Description'] || '';
                
                // Identification fields are key for codes
                const sellerCode = item['cac:SellersItemIdentification']?.['cbc:ID'] || '';
                const buyerCode = item['cac:BuyersItemIdentification']?.['cbc:ID'] || '';
                
                // Priority for Product Name
                const productName = name || description || 'İsimsiz Ürün';
                
                // Priority for Product Code
                // If there's a seller code, it's usually the most reliable
                let productCode = sellerCode || name || buyerCode || '';

                // If code and name are same, or code is empty, try to extract from description
                if ((!productCode || productCode === productName) && description) {
                    // Look for common patterns like 25-0035 in description
                    const codeMatch = description.match(/([A-Z0-9-]{4,})/);
                    if (codeMatch) {
                        productCode = codeMatch[1];
                    }
                }

                const quantity = parseFloat(line['cbc:InvoicedQuantity'] || line['cbc:DeliveredQuantity'] || '0');
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
}
