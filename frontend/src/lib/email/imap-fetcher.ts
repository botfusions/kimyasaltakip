import { ImapFlow } from "imapflow";
import { simpleParser, ParsedMail } from "mailparser";
import { createAdminClient } from "../supabase/server";

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
      .from("kts_settings")
      .select("key, value")
      .in("key", [
        "GMAIL_IMAP_ENABLED",
        "GMAIL_IMAP_USER",
        "GMAIL_IMAP_PASSWORD",
        "GMAIL_IMAP_FOLDER",
        "GMAIL_IMAP_SEARCH_FROM",
        "GMAIL_IMAP_SEARCH_SUBJECT",
      ]);

    if (error || !settings) {
      console.error("Failed to load IMAP settings:", error?.message);
      return null;
    }

    const config = settings.reduce((acc: Record<string, string>, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    if (config["GMAIL_IMAP_ENABLED"] !== "true") {
      console.log("Gmail IMAP is disabled");
      return null;
    }

    if (!config["GMAIL_IMAP_USER"] || !config["GMAIL_IMAP_PASSWORD"]) {
      console.error("Gmail IMAP credentials not configured");
      return null;
    }

    return new ImapFetcher({
      host: "imap.gmail.com",
      port: 993,
      user: config["GMAIL_IMAP_USER"],
      password: config["GMAIL_IMAP_PASSWORD"],
      folder: config["GMAIL_IMAP_FOLDER"] || "INBOX",
      searchFrom: config["GMAIL_IMAP_SEARCH_FROM"]
        ? config["GMAIL_IMAP_SEARCH_FROM"]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      searchSubject: config["GMAIL_IMAP_SEARCH_SUBJECT"]
        ? config["GMAIL_IMAP_SEARCH_SUBJECT"]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [], // Başlık filtresini kaldır, hepsini tara
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
      tls: {
        rejectUnauthorized: false,
      },
      logger: false,
    });

    let lock: any = null;

    try {
      // 1. Connect to Gmail
      await client.connect();
      console.log("✅ Gmail IMAP connected");

      // 3. Open mailbox - INBOX is where the test mails are
      const mailboxToOpen = "INBOX";
      result.errors.push(`📂 Attempting to open: ${mailboxToOpen}`);
      lock = await client.getMailboxLock(mailboxToOpen);

      // 4. Get already processed UIDs
      const processedUids = await this.getProcessedUids();
      result.errors.push(
        `📝 Database has ${processedUids.size} processed UIDs`,
      );

      // 5. Search for RECENT messages in INBOX
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - 1); // Last 24 hours

      const searchCriteria: any = { since: sinceDate };
      result.errors.push(`🔍 Searching since: ${sinceDate.toISOString()}`);

      const messages = client.fetch(searchCriteria, {
        envelope: true,
        bodyStructure: true,
        uid: true,
      });

      const emailsFound: number = 0;
      let processedInSession = 0;

      for await (const msg of messages) {
        if (processedInSession >= 10) break; // Limit session

        const uid = msg.uid.toString();
        const subject = msg.envelope?.subject || "";
        const fromAddress = msg.envelope?.from?.[0]?.address || "";
        const date = msg.envelope?.date || new Date();

        // Subject filter
        const lowerSubject = subject.toLowerCase();
        if (
          !lowerSubject.includes("fatura") &&
          !lowerSubject.includes("invoice")
        )
          continue;

        if (processedUids.has(uid)) continue;

        const relevantParts = this.findRelevantParts(msg.bodyStructure);
        if (relevantParts.length === 0) continue;

        processedInSession++;
        result.errors.push(
          `📩 UID:${uid} - Found ${relevantParts.length} parts to fetch.`,
        );

        const attachments: EmailAttachment[] = [];
        for (const p of relevantParts) {
          try {
            const partData = await client.fetchOne(
              uid,
              { bodyParts: [p.partId] },
              { uid: true },
            );
            if (partData && "bodyParts" in partData && partData.bodyParts) {
              const buffer = partData.bodyParts.get(p.partId);
              if (buffer) {
                attachments.push({
                  filename: p.filename || `att_${uid}_${p.partId}`,
                  contentType: p.mime,
                  size: buffer.length,
                  content: buffer,
                });
              }
            }
          } catch (err: any) {
            result.errors.push(
              `   ❌ Error fetching part ${p.partId}: ${err.message}`,
            );
          }
        }

        if (attachments.length > 0) {
          const fetchedEmail: FetchedEmail = {
            uid,
            from: fromAddress,
            subject,
            date,
            bodyPreview: "", // Body preview is optional for now
            attachments,
          };

          const saved = await this.saveInvoiceEmail(fetchedEmail);
          result.invoicesCreated += saved;
          result.emailsFound++;
          console.log(`✅ UID:${uid} processed and saved.`);
        }
      }

      result.success = true;
      // result.emailsFound already incremented in loop
    } catch (error: any) {
      console.error("IMAP fetch error:", error);
      result.errors.push(error.message || "Unknown IMAP error");
    } finally {
      // Release lock if it was acquired
      if (lock) {
        try {
          lock.release();
        } catch (e) {
          console.warn("Failed to release mailbox lock:", e);
        }
      }

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
   * Recursive function to find relevant part IDs from bodyStructure
   */
  private findRelevantParts(
    part: any,
    depth: number = 0,
  ): { partId: string; filename: string; mime: string }[] {
    let found: { partId: string; filename: string; mime: string }[] = [];
    if (!part || depth > 8) return found;

    const type = (part.type || "").toLowerCase();
    const subtype = (part.subtype || "").toLowerCase();
    const mime = `${type}/${subtype}`;
    const partId = part.part;
    const filename = (
      part.disposition?.params?.filename ||
      part.params?.name ||
      ""
    ).toLowerCase();

    const isMatch =
      filename.endsWith(".xml") ||
      filename.endsWith(".pdf") ||
      filename.endsWith(".jpg") ||
      filename.endsWith(".jpeg") ||
      filename.endsWith(".png") ||
      mime.includes("pdf") ||
      mime.includes("xml") ||
      mime.includes("image/");

    if (isMatch && partId) {
      found.push({ partId, filename, mime });
    }

    if (part.childNodes) {
      for (const child of part.childNodes) {
        found = found.concat(this.findRelevantParts(child, depth + 1));
      }
    }
    return found;
  }

  /**
   * Get already processed email UIDs from database
   */
  private async getProcessedUids(): Promise<Set<string>> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("kts_incoming_invoices")
      .select("email_uid");

    if (error || !data) return new Set();

    return new Set(data.map((d) => d.email_uid));
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
        let attachmentType: "xml" | "pdf" | "jpeg" = "xml";
        let attachmentContent: string | null = null;

        if (filename.endsWith(".xml")) {
          attachmentType = "xml";
          attachmentContent = attachment.content.toString("utf-8");
        } else if (filename.endsWith(".pdf")) {
          attachmentType = "pdf";
        } else if (
          filename.endsWith(".jpg") ||
          filename.endsWith(".jpeg") ||
          filename.endsWith(".png")
        ) {
          attachmentType = "jpeg";
        }

        // Try to parse XML immediately
        let parsedData = null;
        let invoiceNumber = null;
        let supplierName = null;
        let invoiceDate = null;
        let totalAmount = null;
        let currency = "TRY";
        let lineCount = 0;

        if (attachmentType === "xml" && attachmentContent) {
          try {
            const { parseInvoiceXML } = await import("@/lib/invoice-parser");
            const parsed = parseInvoiceXML(attachmentContent);
            if (parsed) {
              parsedData = parsed;
              invoiceNumber = parsed.invoiceNumber;
              supplierName = parsed.supplier;
              invoiceDate = parsed.invoiceDate;
              totalAmount = parsed.totalAmount;
              currency = parsed.currencyCode || "TRY";
              lineCount = parsed.lines?.length || 0;
            }
          } catch (parseErr) {
            console.error(
              "XML parse error for attachment:",
              attachment.filename,
              parseErr,
            );
          }
        }

        // Upload attachment to Supabase Storage (if PDF/image)
        let storagePath: string | null = null;
        if (attachmentType !== "xml") {
          const path = `invoices/${email.uid}/${attachment.filename}`;
          const { error: uploadError } = await supabase.storage
            .from("invoice-attachments")
            .upload(path, attachment.content, {
              contentType: attachment.contentType,
              upsert: true,
            });

          if (!uploadError) {
            storagePath = path;
          } else {
            console.error("Storage upload error:", uploadError.message);
          }
        }

        // Insert into database
        const { error: insertError } = await supabase
          .from("kts_incoming_invoices")
          .upsert(
            {
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
              status: parsedData ? "matched" : "pending",
            },
            {
              onConflict: "email_uid,attachment_filename",
            },
          );

        if (insertError) {
          console.error("DB insert error:", insertError.message);
        } else {
          savedCount++;
        }
      } catch (err: any) {
        console.error("Error processing attachment:", err.message);
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

      await supabase.from("kts_email_fetch_log").insert({
        emails_found: result.emailsFound,
        attachments_found: result.attachmentsFound,
        invoices_created: result.invoicesCreated,
        errors: result.errors.length > 0 ? result.errors : null,
        duration_ms: result.durationMs,
        status: result.success ? "success" : "error",
      });
    } catch (err) {
      console.error("Failed to log fetch operation:", err);
    }
  }
}
