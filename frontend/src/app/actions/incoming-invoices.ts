'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { getMaterials } from './materials';
import { matchMaterial, parseInvoiceXML } from '@/lib/invoice-parser';

/**
 * Get all incoming invoices with filters
 */
export async function getIncomingInvoices(filters?: {
    status?: string;
    limit?: number;
}) {
    try {
        const supabase = await createClient();

        let query = supabase
            .from('kts_incoming_invoices')
            .select('*')
            .order('email_date', { ascending: false });

        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }

        if (filters?.limit) {
            query = query.limit(filters.limit);
        } else {
            query = query.limit(100);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        console.error('getIncomingInvoices error:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get a single incoming invoice by ID
 */
export async function getIncomingInvoice(id: string) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('kts_incoming_invoices')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

/**
 * Process an incoming invoice - match materials and prepare for import
 */
export async function processIncomingInvoice(id: string) {
    try {
        const user = await getCurrentUser();
        if (!user || !['admin', 'warehouse'].includes(user.role)) {
            return { success: false, error: 'Yetki yetersiz' };
        }

        const supabase = await createClient();

        // 1. Get the incoming invoice
        const { data: invoice, error: fetchError } = await supabase
            .from('kts_incoming_invoices')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !invoice) {
            return { success: false, error: 'Fatura bulunamadı' };
        }

        // 2. Parse if not already parsed
        let parsedData = invoice.parsed_data;

        if (!parsedData && invoice.attachment_content && invoice.attachment_type === 'xml') {
            parsedData = parseInvoiceXML(invoice.attachment_content);

            if (parsedData) {
                await supabase
                    .from('kts_incoming_invoices')
                    .update({
                        parsed_data: parsedData,
                        invoice_number: parsedData.invoiceNumber,
                        supplier_name: parsedData.supplier,
                        invoice_date: parsedData.invoiceDate,
                        total_amount: parsedData.totalAmount,
                        currency: parsedData.currencyCode || 'TRY',
                        line_count: parsedData.lines?.length || 0,
                    })
                    .eq('id', id);
            }
        }

        if (!parsedData || !parsedData.lines || parsedData.lines.length === 0) {
            await supabase
                .from('kts_incoming_invoices')
                .update({ status: 'error', error_message: 'Fatura parse edilemedi veya satır bulunamadı' })
                .eq('id', id);

            return { success: false, error: 'Fatura parse edilemedi' };
        }

        // 3. Match materials
        const materialsResult = await getMaterials();
        if (materialsResult.error || !materialsResult.data) {
            return { success: false, error: 'Malzemeler yüklenemedi' };
        }

        const materials = materialsResult.data;
        let matchedCount = 0;
        let unmatchedCount = 0;
        const matchResults: any[] = [];

        for (const line of parsedData.lines) {
            const match = matchMaterial(line.productCode, line.productName, materials);
            matchResults.push({
                ...line,
                materialId: match.materialId,
                materialName: match.materialName,
                confidence: match.confidence,
                matched: match.materialId && match.confidence >= 0.6,
            });

            if (match.materialId && match.confidence >= 0.6) {
                matchedCount++;
            } else {
                unmatchedCount++;
            }
        }

        // 4. Update invoice with match results
        const newStatus = unmatchedCount === 0 ? 'matched' : 'processing';

        await supabase
            .from('kts_incoming_invoices')
            .update({
                status: newStatus,
                match_result: matchResults,
                matched_count: matchedCount,
                unmatched_count: unmatchedCount,
            })
            .eq('id', id);

        revalidatePath('/dashboard/invoices/incoming');

        return {
            success: true,
            matchedCount,
            unmatchedCount,
            matchResults,
            status: newStatus,
        };
    } catch (error: any) {
        console.error('processIncomingInvoice error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Import a processed incoming invoice into stock
 * Creates stock movements for all matched lines
 */
export async function importIncomingInvoice(id: string) {
    try {
        const user = await getCurrentUser();
        if (!user || !['admin', 'warehouse'].includes(user.role)) {
            return { success: false, error: 'Yetki yetersiz' };
        }

        const supabase = await createClient();

        // 1. Get invoice
        const { data: invoice, error: fetchError } = await supabase
            .from('kts_incoming_invoices')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !invoice) {
            return { success: false, error: 'Fatura bulunamadı' };
        }

        if (invoice.status === 'imported') {
            return { success: false, error: 'Bu fatura zaten içe aktarılmış' };
        }

        if (!invoice.match_result || !Array.isArray(invoice.match_result)) {
            return { success: false, error: 'Önce faturayı işleyin (malzeme eşleştirmesi yapılmamış)' };
        }

        // 2. Create stock movements for matched lines
        let stockMovementsCreated = 0;
        const errors: string[] = [];
        const matchResult = (invoice.match_result || []) as any[];

        for (const line of matchResult) {
            if (!line.matched || !line.materialId) continue;

            // Create stock movement
            const { error: movementError } = await supabase.from('kts_stock_movements').insert({
                material_id: line.materialId,
                movement_type: 'in',
                quantity: line.quantity || 0,
                unit_cost: line.unitPrice || null,
                total_cost: line.totalAmount,
                batch_number: null,
                supplier: invoice.supplier_name,
                reference_type: 'invoice', // Keep as 'invoice' to match UI
                reference_id: invoice.invoice_number,
                notes: `E-Fatura: ${invoice.invoice_number} - ${line.materialName || line.productName} (Orijinal: ${line.productName})`,
                created_by: user.id,
            });

            if (movementError) {
                errors.push(`${line.productName}: ${movementError.message}`);
                continue;
            }

            // Update stock
            const { data: currentStock } = await supabase
                .from('kts_stock')
                .select('quantity')
                .eq('material_id', line.materialId)
                .single();

            const currentQuantity = currentStock?.quantity || 0;
            const newQuantity = currentQuantity + (line.quantity || 0);

            await supabase.from('kts_stock').upsert({
                material_id: line.materialId,
                quantity: newQuantity,
                last_movement_at: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                updated_by: user.id,
            });

            stockMovementsCreated++;
        }

        // 3. Update invoice status
        await supabase
            .from('kts_incoming_invoices')
            .update({
                status: 'imported',
                imported_at: new Date().toISOString(),
                imported_by: user.id,
                import_notes: errors.length > 0
                    ? `${stockMovementsCreated} hareket oluşturuldu, ${errors.length} hata: ${errors.join('; ')}`
                    : `${stockMovementsCreated} hareket başarıyla oluşturuldu`,
            })
            .eq('id', id);

        revalidatePath('/dashboard/invoices/incoming');
        revalidatePath('/dashboard/stock');

        return {
            success: true,
            stockMovementsCreated,
            errors,
            message: `${stockMovementsCreated} stok hareketi oluşturuldu`,
        };
    } catch (error: any) {
        console.error('importIncomingInvoice error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update incoming invoice status (ignore, re-process, etc.)
 */
export async function updateIncomingInvoiceStatus(id: string, status: string, notes?: string) {
    try {
        const user = await getCurrentUser();
        if (!user || !['admin', 'warehouse'].includes(user.role)) {
            return { success: false, error: 'Yetki yetersiz' };
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from('kts_incoming_invoices')
            .update({
                status,
                import_notes: notes || null,
            })
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/dashboard/invoices/incoming');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get email fetch logs
 */
export async function getEmailFetchLogs(limit = 20) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('kts_email_fetch_log')
            .select('*')
            .order('fetched_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

/**
 * Trigger manual email fetch
 */
export async function triggerEmailFetch() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return { success: false, error: 'Sadece admin bu işlemi yapabilir' };
        }

        const { ImapFetcher } = await import('@/lib/email/imap-fetcher');
        const fetcher = await ImapFetcher.fromSettings();

        if (!fetcher) {
            return {
                success: false,
                error: 'Gmail IMAP yapılandırması eksik veya devre dışı. Ayarlar sayfasından GMAIL_IMAP ayarlarını aktif edin.',
            };
        }

        const result = await fetcher.fetchNewInvoices();

        revalidatePath('/dashboard/invoices/incoming');

        return {
            success: result.success,
            data: {
                emailsFound: result.emailsFound,
                attachmentsFound: result.attachmentsFound,
                invoicesCreated: result.invoicesCreated,
                durationMs: result.durationMs,
                errors: result.errors,
            },
            message: result.success
                ? `${result.emailsFound} e-posta tarandı, ${result.invoicesCreated} fatura kaydedildi (${result.durationMs}ms)`
                : `Hata: ${result.errors.join(', ')}`,
        };
    } catch (error: any) {
        console.error('triggerEmailFetch error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get incoming invoices statistics
 */
export async function getIncomingInvoiceStats() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('kts_incoming_invoices')
            .select('status');

        if (error) throw error;

        const stats = {
            total: data?.length || 0,
            pending: 0,
            processing: 0,
            matched: 0,
            imported: 0,
            error: 0,
            ignored: 0,
        };

        data?.forEach(item => {
            const key = item.status as keyof typeof stats;
            if (key in stats && key !== 'total') {
                (stats[key] as number)++;
            }
        });

        return { data: stats, error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}
