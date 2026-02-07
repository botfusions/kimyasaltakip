'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { getMaterials } from './materials';
import { parseInvoiceXML, parseOCRText, matchMaterial, Invoice, InvoiceLine } from '@/lib/invoice-parser';

export interface InvoiceImportResult {
    success: boolean;
    invoice?: Invoice;
    matchedLines?: number;
    unmatchedLines?: InvoiceLine[];
    stockMovements?: number;
    error?: string;
}

/**
 * Import invoice from OCR text (PDF/JPEG)
 * Parses OCR text, matches materials, and creates stock movements
 */
export async function importInvoiceFromOCR(ocrText: string): Promise<InvoiceImportResult> {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || !['admin', 'warehouse'].includes(currentUser.role)) {
            return { success: false, error: 'Bu işlem için yetkiniz yok' };
        }

        // 1. Parse OCR text
        const invoice = parseOCRText(ocrText);

        if (!invoice) {
            return { success: false, error: 'Fatura metni parse edilemedi' };
        }

        if (!invoice.lines || invoice.lines.length === 0) {
            return { success: false, error: 'Faturada ürün satırı bulunamadı' };
        }

        // 2. Get all materials for matching
        const materialsResult = await getMaterials();

        if (materialsResult.error || !materialsResult.data) {
            return { success: false, error: 'Malzemeler yüklenemedi' };
        }

        const materials = materialsResult.data;

        // 3. Match invoice lines with materials
        const matchedLines: InvoiceLine[] = [];
        const unmatchedLines: InvoiceLine[] = [];

        for (const line of invoice.lines) {
            const match = matchMaterial(line.productCode, line.productName, materials);

            if (match.materialId && match.confidence >= 0.6) {
                line.matchedMaterialId = match.materialId;
                line.matchConfidence = match.confidence;
                matchedLines.push(line);
            } else {
                unmatchedLines.push(line);
            }
        }

        // 4. If there are unmatched lines, return error
        if (unmatchedLines.length > 0) {
            return {
                success: false,
                error: `${unmatchedLines.length} ürün eşleştirilemedi. Lütfen malzeme kodlarını kontrol edin.`,
                invoice,
                unmatchedLines,
                matchedLines: matchedLines.length,
            };
        }

        // 5. Create stock movements for matched lines
        const supabase = await createClient();
        let stockMovementsCreated = 0;

        for (const line of matchedLines) {
            if (!line.matchedMaterialId) continue;

            // Create stock movement (IN)
            const { error: movementError } = await supabase.from('stock_movements').insert({
                material_id: line.matchedMaterialId,
                movement_type: 'in',
                quantity: line.quantity || 0,
                unit_cost: line.unitPrice || null,
                total_cost: line.totalAmount,
                batch_number: null,
                supplier: invoice.supplier,
                reference_type: 'invoice',
                reference_id: invoice.invoiceNumber,
                notes: `Fatura: ${invoice.invoiceNumber} - ${line.productName} (Kod: ${line.productCode}) [OCR]`,
                created_by: currentUser.id,
            });

            if (movementError) {
                console.error('Stock movement error:', movementError);
                continue;
            }

            // Update stock table
            const { data: currentStock } = await supabase
                .from('stock')
                .select('quantity')
                .eq('material_id', line.matchedMaterialId)
                .single();

            const currentQuantity = currentStock?.quantity || 0;
            const newQuantity = currentQuantity + (line.quantity || 0);

            await supabase.from('stock').upsert({
                material_id: line.matchedMaterialId,
                quantity: newQuantity,
                last_movement_at: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                updated_by: currentUser.id,
            });

            stockMovementsCreated++;
        }

        revalidatePath('/dashboard/stock');
        revalidatePath('/dashboard/invoices');

        return {
            success: true,
            invoice,
            matchedLines: matchedLines.length,
            stockMovements: stockMovementsCreated,
        };
    } catch (error: any) {
        console.error('Import invoice from OCR error:', error);
        return { success: false, error: error.message || 'Fatura içe aktarılamadı' };
    }
}

/**
 * Import invoice from XML content
 * Parses XML, matches materials, and creates stock movements
 */
export async function importInvoice(xmlContent: string): Promise<InvoiceImportResult> {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || !['admin', 'warehouse'].includes(currentUser.role)) {
            return { success: false, error: 'Bu işlem için yetkiniz yok' };
        }

        // 1. Parse XML
        const invoice = parseInvoiceXML(xmlContent);

        if (!invoice) {
            return { success: false, error: 'Fatura XML formatı geçersiz' };
        }

        if (!invoice.lines || invoice.lines.length === 0) {
            return { success: false, error: 'Faturada ürün satırı bulunamadı' };
        }

        // 2. Get all materials for matching
        const materialsResult = await getMaterials();

        if (materialsResult.error || !materialsResult.data) {
            return { success: false, error: 'Malzemeler yüklenemedi' };
        }

        const materials = materialsResult.data;

        // 3. Match invoice lines with materials
        const matchedLines: InvoiceLine[] = [];
        const unmatchedLines: InvoiceLine[] = [];

        for (const line of invoice.lines) {
            const match = matchMaterial(line.productCode, line.productName, materials);

            if (match.materialId && match.confidence >= 0.6) {
                line.matchedMaterialId = match.materialId;
                line.matchConfidence = match.confidence;
                matchedLines.push(line);
            } else {
                unmatchedLines.push(line);
            }
        }

        // 4. If there are unmatched lines, return error
        if (unmatchedLines.length > 0) {
            return {
                success: false,
                error: `${unmatchedLines.length} ürün eşleştirilemedi. Lütfen malzeme kodlarını kontrol edin.`,
                invoice,
                unmatchedLines,
                matchedLines: matchedLines.length,
            };
        }

        // 5. Create stock movements for matched lines
        const supabase = await createClient();
        let stockMovementsCreated = 0;

        for (const line of matchedLines) {
            if (!line.matchedMaterialId) continue;

            // Create stock movement (IN)
            const { error: movementError } = await supabase.from('stock_movements').insert({
                material_id: line.matchedMaterialId,
                movement_type: 'in',
                quantity: line.quantity || 0,
                unit_cost: line.unitPrice || null,
                total_cost: line.totalAmount,
                batch_number: null,
                supplier: invoice.supplier,
                reference_type: 'invoice',
                reference_id: invoice.invoiceNumber,
                notes: `Fatura: ${invoice.invoiceNumber} - ${line.productName} (Kod: ${line.productCode})`,
                created_by: currentUser.id,
            });

            if (movementError) {
                console.error('Stock movement error:', movementError);
                continue;
            }

            // Update stock table
            const { data: currentStock } = await supabase
                .from('stock')
                .select('quantity')
                .eq('material_id', line.matchedMaterialId)
                .single();

            const currentQuantity = currentStock?.quantity || 0;
            const newQuantity = currentQuantity + (line.quantity || 0);

            await supabase.from('stock').upsert({
                material_id: line.matchedMaterialId,
                quantity: newQuantity,
                last_movement_at: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                updated_by: currentUser.id,
            });

            stockMovementsCreated++;
        }

        revalidatePath('/dashboard/stock');
        revalidatePath('/dashboard/invoices');

        return {
            success: true,
            invoice,
            matchedLines: matchedLines.length,
            stockMovements: stockMovementsCreated,
        };
    } catch (error: any) {
        console.error('Import invoice error:', error);
        return { success: false, error: error.message || 'Fatura içe aktarılamadı' };
    }
}

/**
 * Get invoice import history from stock movements
 */
export async function getInvoiceHistory(limit = 50) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return { data: [], error: 'Oturum açmanız gerekiyor' };
        }

        const supabase = await createClient();

        // Get stock movements with reference_type = 'invoice'
        const { data, error } = await supabase
            .from('stock_movements')
            .select(`
                *,
                material:materials(id, code, name, unit),
                created_by_user:users!stock_movements_created_by_fkey(id, name)
            `)
            .eq('reference_type', 'invoice')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            return { data: [], error: error.message };
        }

        // Group by invoice number
        const groupedByInvoice = (data || []).reduce((acc: any, movement: any) => {
            const invoiceNumber = movement.reference_id || 'N/A';

            if (!acc[invoiceNumber]) {
                acc[invoiceNumber] = {
                    invoiceNumber,
                    supplier: movement.supplier,
                    date: movement.created_at,
                    lines: [],
                    totalAmount: 0,
                };
            }

            acc[invoiceNumber].lines.push(movement);
            acc[invoiceNumber].totalAmount += movement.total_cost || 0;

            return acc;
        }, {});

        const invoices = Object.values(groupedByInvoice);

        return { data: invoices, error: null };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
}
