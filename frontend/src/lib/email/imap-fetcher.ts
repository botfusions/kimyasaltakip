import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { createAdminClient } from '@/lib/supabase/server';

export interface EmailAttachment {
    filename: string;
    contentType: string;
    size: number;
    content: Buffer;
}

export interface FetchedEmail {
    uid: string;
    from: string;
    subject: string;
    date: Date;
    bodyPreview: string;
    attachments: EmailAttachment[];
}

export interface ImapConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    folder: string;
    searchFrom: string[];
    searchSubject: string[];
}

export interface FetchResult {
    success: boolean;
    emailsFound: number;
    attachmentsFound: number;
    invoicesCreated: number;
    errors: string[];
    durationMs: number;
}

/**
 * Gmail IMAP Email Fetcher Service
 * Connects to Gmail via IMAP and fetches invoice attachments (XML, PDF)
 */
export class ImapFetcher {
    private config: ImapConfig;

    constructor(config: ImapConfig) {
        this.config = config;
    }

    /**
     * Load IMAP configuration from kts_settings
     */
    static async fromSettings(): Promise<ImapFetcher | null> {
        const supabase = createAdminClient();

        const { data: settings, error } = await supabase
            .from('kts_settings')
            .select('key, value')
            .in('key', [
                'GMAIL_IMAP_ENABLED',
                'GMAIL_IMAP_USER',
                'GMAIL_IMAP_PASSWORD',
                'GMAIL_IMAP_FOLDER',
                'GMAIL_IMAP_SEARCH_FROM',
                'GMAIL_IMAP_SEARCH_SUBJECT',
            ]);

        if (error || !settings) {
            console.error('Failed to load IMAP settings:', error?.message);
            return null;
        }

        const config = settings.reduce((acc: Record<string, string>, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});

        if (config['GMAIL_IMAP_ENABLED'] !== 'true') {
            console.log('Gmail IMAP is disabled');
            return null;
        }

        if (!config['GMAIL_IMAP_USER'] || !config['GMAIL_IMAP_PASSWORD']) {
            console.error('Gmail IMAP credentials not configured');
            return null;
        }

        return new ImapFetcher({
            host: 'imap.gmail.com',
            port: 993,
            user: config['GMAIL_IMAP_USER'],
            password: config['GMAIL_IMAP_PASSWORD'],
            folder: config['GMAIL_IMAP_FOLDER'] || 'INBOX',
            searchFrom: config['GMAIL_IMAP_SEARCH_FROM']
                ? config['GMAIL_IMAP_SEARCH_FROM'].split(',').map(s => s.trim()).filter(Boolean)
                : [],
            searchSubject: config['GMAIL_IMAP_SEARCH_SUBJECT']
                ? config['GMAIL_IMAP_SEARCH_SUBJECT'].split(',').map(s => s.trim()).filter(Boolean)
                : ['fatura', 'invoice', 'e-fatura'],
        });
    }

    /**
     * Fetch new invoice emails from Gmail
     */
    async fetchNewInvoices(): Promise<FetchResult> {
        const startTime = Date.now();
        const result: FetchResult = {
            success: false,
            emailsFound: 0,
            attachmentsFound: 0,
            invoicesCreated: 0,
            errors: [],
            durationMs: 0,
        };

        const client = new ImapFlow({
            host: this.config.host,
            port: this.config.port,
            secure: true,
            auth: {
                user: this.config.user,
                pass: this.config.password,
            },
            logger: false,
        });

        try {
            // 1. Connect to Gmail
            await client.connect();
            console.log('✅ Gmail IMAP connected');

            // 2. Open mailbox
            const lock = await client.getMailboxLock(this.config.folder);

            try {
                // 3. Get already processed UIDs from database
                const processedUids = await this.getProcessedUids();

                // 4. Search for invoice emails (unseen or last 7 days)
                const searchCriteria: any = {
                    since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                };

                const messages = client.fetch(searchCriteria, {
                    envelope: true,
                    bodyStructure: true,
                    uid: true,
                });

                const emails: FetchedEmail[] = [];

                for await (const msg of messages) {
                    const uid = msg.uid.toString();

                    // Skip already processed
                    if (processedUids.has(uid)) continue;

                    // Check subject filter
                    const subject = msg.envelope?.subject || '';
                    const matchesSubject = this.config.searchSubject.length === 0 ||
                        this.config.searchSubject.some(keyword =>
                            subject.toLowerCase().includes(keyword.toLowerCase())
                        );

                    // Check sender filter
                    const fromAddress = msg.envelope?.from?.[0]?.address || '';
                    const matchesFrom = this.config.searchFrom.length === 0 ||
                        this.config.searchFrom.some(addr =>
                            fromAddress.toLowerCase().includes(addr.toLowerCase())
                        );

                    if (!matchesSubject && !matchesFrom) continue;

                    // Check for attachments
                    const hasAttachments = this.hasRelevantAttachments(msg.bodyStructure);
                    if (!hasAttachments) continue;

                    // Fetch full message
                    const fullMessage = await client.download(uid, undefined, { uid: true });

                    if (fullMessage?.content) {
                        const parsed = await simpleParser(fullMessage.content);
                        const fetchedEmail = this.extractEmailData(uid, parsed);

                        if (fetchedEmail.attachments.length > 0) {
                            emails.push(fetchedEmail);
                            result.emailsFound++;
                            result.attachmentsFound += fetchedEmail.attachments.length;
                        }
                    }
                }

                // 5. Save to database
                for (const email of emails) {
                    const saved = await this.saveInvoiceEmail(email);
                    result.invoicesCreated += saved;
                }

                result.success = true;

            } finally {
                lock.release();
            }

        } catch (error: any) {
            console.error('IMAP fetch error:', error);
            result.errors.push(error.message || 'Unknown IMAP error');
        } finally {
            try {
                await client.logout();
            } catch {
                // Ignore logout errors
            }
            result.durationMs = Date.now() - startTime;
        }

        // 6. Log the fetch operation
        await this.logFetchOperation(result);

        return result;
    }

    /**
     * Check if message body structure contains relevant attachments
     */
    private hasRelevantAttachments(bodyStructure: any): boolean {
        if (!bodyStructure) return false;

        const validTypes = [
            'application/xml',
            'text/xml',
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/octet-stream',
        ];

        const validExtensions = ['.xml', '.pdf', '.jpg', '.jpeg', '.png'];

        const check = (part: any): boolean => {
            if (!part) return false;

            const type = `${part.type || ''}/${part.subtype || ''}`.toLowerCase();
            const filename = (part.disposition?.params?.filename || part.params?.name || '').toLowerCase();

            if (validTypes.includes(type) || validExtensions.some(ext => filename.endsWith(ext))) {
                return true;
            }

            if (part.childNodes) {
                return part.childNodes.some(check);
            }

            return false;
        };

        return check(bodyStructure);
    }

    /**
     * Extract email data from parsed mail
     */
    private extractEmailData(uid: string, parsed: ParsedMail): FetchedEmail {
        const validExtensions = ['.xml', '.pdf', '.jpg', '.jpeg', '.png'];

        const attachments: EmailAttachment[] = (parsed.attachments || [])
            .filter(att => {
                const filename = (att.filename || '').toLowerCase();
                return validExtensions.some(ext => filename.endsWith(ext));
            })
            .map(att => ({
                filename: att.filename || `attachment_${uid}`,
                contentType: att.contentType || 'application/octet-stream',
                size: att.size || 0,
                content: att.content,
            }));

        const bodyText = parsed.text || '';

        return {
            uid,
            from: parsed.from?.text || '',
            subject: parsed.subject || '',
            date: parsed.date || new Date(),
            bodyPreview: bodyText.substring(0, 500),
            attachments,
        };
    }

    /**
     * Get already processed email UIDs from database
     */
    private async getProcessedUids(): Promise<Set<string>> {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('kts_incoming_invoices')
            .select('email_uid');

        if (error || !data) return new Set();

        return new Set(data.map(d => d.email_uid));
    }

    /**
     * Save fetched email and attachments to database
     */
    private async saveInvoiceEmail(email: FetchedEmail): Promise<number> {
        const supabase = createAdminClient();
        let savedCount = 0;

        for (const attachment of email.attachments) {
            try {
                const filename = attachment.filename.toLowerCase();
                let attachmentType: 'xml' | 'pdf' | 'jpeg' = 'xml';
                let attachmentContent: string | null = null;

                if (filename.endsWith('.xml')) {
                    attachmentType = 'xml';
                    attachmentContent = attachment.content.toString('utf-8');
                } else if (filename.endsWith('.pdf')) {
                    attachmentType = 'pdf';
                } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.png')) {
                    attachmentType = 'jpeg';
                }

                // Try to parse XML immediately
                let parsedData = null;
                let invoiceNumber = null;
                let supplierName = null;
                let invoiceDate = null;
                let totalAmount = null;
                let currency = 'TRY';
                let lineCount = 0;

                if (attachmentType === 'xml' && attachmentContent) {
                    try {
                        const { parseInvoiceXML } = await import('@/lib/invoice-parser');
                        const parsed = parseInvoiceXML(attachmentContent);
                        if (parsed) {
                            parsedData = parsed;
                            invoiceNumber = parsed.invoiceNumber;
                            supplierName = parsed.supplier;
                            invoiceDate = parsed.invoiceDate;
                            totalAmount = parsed.totalAmount;
                            currency = parsed.currencyCode || 'TRY';
                            lineCount = parsed.lines?.length || 0;
                        }
                    } catch (parseErr) {
                        console.error('XML parse error for attachment:', attachment.filename, parseErr);
                    }
                }

                // Upload attachment to Supabase Storage (if PDF/image)
                let storagePath: string | null = null;
                if (attachmentType !== 'xml') {
                    const path = `invoices/${email.uid}/${attachment.filename}`;
                    const { error: uploadError } = await supabase.storage
                        .from('invoice-attachments')
                        .upload(path, attachment.content, {
                            contentType: attachment.contentType,
                            upsert: true,
                        });

                    if (!uploadError) {
                        storagePath = path;
                    } else {
                        console.error('Storage upload error:', uploadError.message);
                    }
                }

                // Insert into database
                const { error: insertError } = await supabase
                    .from('kts_incoming_invoices')
                    .upsert({
                        email_uid: email.uid,
                        email_from: email.from,
                        email_subject: email.subject,
                        email_date: email.date.toISOString(),
                        email_body_preview: email.bodyPreview,
                        attachment_filename: attachment.filename,
                        attachment_type: attachmentType,
                        attachment_size: attachment.size,
                        attachment_storage_path: storagePath,
                        attachment_content: attachmentContent,
                        parsed_data: parsedData,
                        invoice_number: invoiceNumber,
                        supplier_name: supplierName,
                        invoice_date: invoiceDate,
                        total_amount: totalAmount,
                        currency: currency,
                        line_count: lineCount,
                        status: parsedData ? 'matched' : 'pending',
                    }, {
                        onConflict: 'email_uid,attachment_filename',
                    });

                if (insertError) {
                    console.error('DB insert error:', insertError.message);
                } else {
                    savedCount++;
                }
            } catch (err: any) {
                console.error('Error processing attachment:', err.message);
            }
        }

        return savedCount;
    }

    /**
     * Log fetch operation to database
     */
    private async logFetchOperation(result: FetchResult): Promise<void> {
        try {
            const supabase = createAdminClient();

            await supabase.from('kts_email_fetch_log').insert({
                emails_found: result.emailsFound,
                attachments_found: result.attachmentsFound,
                invoices_created: result.invoicesCreated,
                errors: result.errors.length > 0 ? result.errors : null,
                duration_ms: result.durationMs,
                status: result.success ? 'success' : 'error',
            });
        } catch (err) {
            console.error('Failed to log fetch operation:', err);
        }
    }
}
