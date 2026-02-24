import { XmlInvoiceParser } from './invoice/XmlParser';
import { OcrInvoiceParser } from './invoice/OcrParser';
import { MatchingEngine } from './invoice/MatchingEngine';

/**
 * Interface representing a line item in an invoice
 */
export interface InvoiceLine {
    lineNumber: number;
    productCode: string;
    productName: string;
    quantity?: number;
    unitPrice?: number;
    totalAmount: number;
    currency: string;
    matchedMaterialId?: string | null;
    matchConfidence?: number;
}

/**
 * Interface representing a parsed invoice
 */
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
 * Parse XML content from an e-invoice (UBL format)
 */
export function parseInvoiceXML(xmlContent: string): Invoice | null {
    return XmlInvoiceParser.parse(xmlContent);
}

/**
 * Parse OCR text from PDF/JPEG invoice
 */
export function parseOCRText(ocrText: string): Invoice | null {
    return OcrInvoiceParser.parse(ocrText);
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
    return MatchingEngine.matchMaterial(productCode, productName, materials);
}
