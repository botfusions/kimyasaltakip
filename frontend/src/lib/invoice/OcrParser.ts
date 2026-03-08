import { Invoice, InvoiceLine } from "../invoice-parser";

/**
 * Service to parse OCR text from PDF/JPEG invoice
 */
export class OcrInvoiceParser {
  static parse(ocrText: string): Invoice | null {
    try {
      // Extract invoice number
      let invoiceNumber = "N/A";
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
      const invoiceDate = dateMatch
        ? dateMatch[1].replace(/[/-]/g, ".")
        : undefined;

      // Extract supplier
      let supplier = "Bilinmiyor";
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
          totalAmount = parseFloat(
            match[1].replace(/\./g, "").replace(",", "."),
          );
          break;
        }
      }

      // Extract product lines
      const productLines: InvoiceLine[] = [];
      let lineNumber = 1;

      const productCodePattern =
        /([A-Z0-9-]{4,})\s+(.{10,}?)\s+([\d.,]+)\s+([\d.,]+)/g;
      let match;

      while ((match = productCodePattern.exec(ocrText)) !== null) {
        const [, code, name, quantity, amount] = match;

        productLines.push({
          lineNumber: lineNumber++,
          productCode: code.trim(),
          productName: name.trim(),
          quantity: parseFloat(quantity.replace(",", ".")),
          totalAmount: parseFloat(amount.replace(/\./g, "").replace(",", ".")),
          currency: "TRY",
        });
      }

      if (productLines.length === 0) {
        const simplePattern =
          /([A-Z0-9]{5,})\s+([A-ZİĞÜŞÖÇa-zığüşöç\s-]{10,})/g;
        while ((match = simplePattern.exec(ocrText)) !== null) {
          productLines.push({
            lineNumber: lineNumber++,
            productCode: match[1].trim(),
            productName: match[2].trim(),
            totalAmount: 0,
            currency: "TRY",
          });
        }
      }

      return {
        invoiceNumber,
        invoiceDate,
        supplier,
        buyer: "DENİZLİ RATEKS TEKSTİL",
        currencyCode: "TRY",
        totalAmount,
        lines: productLines,
      };
    } catch (error) {
      console.error("OCR text parsing error:", error);
      return null;
    }
  }
}
