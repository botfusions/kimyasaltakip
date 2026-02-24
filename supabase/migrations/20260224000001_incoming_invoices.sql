-- ============================================
-- Migration: Incoming Email Invoices System
-- Date: 2026-02-24
-- Description: Table for auto-fetched invoices from email
-- ============================================

-- 1. Incoming invoices table
CREATE TABLE IF NOT EXISTS kts_incoming_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Email metadata
    email_uid TEXT NOT NULL,                    -- IMAP UID (duplicate prevention)
    email_from TEXT,                            -- Sender email address
    email_subject TEXT,                         -- Email subject line
    email_date TIMESTAMPTZ,                     -- Email received date
    email_body_preview TEXT,                    -- First 500 chars of email body
    
    -- Attachment info
    attachment_filename TEXT NOT NULL,          -- Original filename
    attachment_type TEXT NOT NULL DEFAULT 'xml', -- 'xml', 'pdf', 'jpeg'
    attachment_size INTEGER,                    -- File size in bytes
    attachment_storage_path TEXT,               -- Supabase storage path
    attachment_content TEXT,                    -- Raw content (for XML) or OCR text
    
    -- Parsed invoice data (JSON)
    parsed_data JSONB,                         -- Full parsed invoice object
    invoice_number TEXT,                       -- Extracted invoice number
    supplier_name TEXT,                        -- Extracted supplier name
    invoice_date DATE,                         -- Extracted invoice date
    total_amount NUMERIC(12,2),                -- Extracted total amount
    currency TEXT DEFAULT 'TRY',               -- Currency code
    line_count INTEGER DEFAULT 0,              -- Number of invoice lines
    
    -- Processing status
    status TEXT NOT NULL DEFAULT 'pending',     -- pending, processing, matched, imported, error, ignored
    match_result JSONB,                        -- Material matching results
    matched_count INTEGER DEFAULT 0,           -- Successfully matched lines
    unmatched_count INTEGER DEFAULT 0,         -- Unmatched lines
    
    -- Import tracking
    imported_at TIMESTAMPTZ,                   -- When stock movements were created
    imported_by UUID REFERENCES auth.users(id),
    import_notes TEXT,
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate imports
    UNIQUE(email_uid, attachment_filename)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_kts_incoming_invoices_status ON kts_incoming_invoices(status);
CREATE INDEX IF NOT EXISTS idx_kts_incoming_invoices_email_date ON kts_incoming_invoices(email_date DESC);
CREATE INDEX IF NOT EXISTS idx_kts_incoming_invoices_supplier ON kts_incoming_invoices(supplier_name);
CREATE INDEX IF NOT EXISTS idx_kts_incoming_invoices_invoice_number ON kts_incoming_invoices(invoice_number);

-- 3. Enable RLS
ALTER TABLE kts_incoming_invoices ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "kts_incoming_invoices_select" ON kts_incoming_invoices
    FOR SELECT USING (true);

CREATE POLICY "kts_incoming_invoices_insert" ON kts_incoming_invoices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "kts_incoming_invoices_update" ON kts_incoming_invoices
    FOR UPDATE USING (true);

CREATE POLICY "kts_incoming_invoices_delete" ON kts_incoming_invoices
    FOR DELETE USING (true);

-- 5. Email fetch log table (tracks each IMAP check)
CREATE TABLE IF NOT EXISTS kts_email_fetch_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    emails_found INTEGER DEFAULT 0,
    attachments_found INTEGER DEFAULT 0,
    invoices_created INTEGER DEFAULT 0,
    errors TEXT[],
    duration_ms INTEGER,
    status TEXT DEFAULT 'success' -- success, error, partial
);

ALTER TABLE kts_email_fetch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kts_email_fetch_log_all" ON kts_email_fetch_log
    FOR ALL USING (true);

-- 6. Add Gmail IMAP settings to kts_settings
INSERT INTO kts_settings (key, value, data_type, category, description, is_editable) VALUES
    ('GMAIL_IMAP_ENABLED', 'false', 'boolean', 'email', 'Gmail IMAP fatura alma aktif mi?', true),
    ('GMAIL_IMAP_USER', '', 'string', 'email', 'Gmail e-posta adresi', true),
    ('GMAIL_IMAP_PASSWORD', '', 'string', 'email', 'Gmail uygulama şifresi (App Password)', true),
    ('GMAIL_IMAP_FOLDER', 'INBOX', 'string', 'email', 'Kontrol edilecek klasör', true),
    ('GMAIL_IMAP_SEARCH_FROM', '', 'string', 'email', 'Sadece bu adreslerden gelen e-postalar (virgülle ayrılmış, boş=hepsi)', true),
    ('GMAIL_IMAP_SEARCH_SUBJECT', 'fatura,invoice,e-fatura', 'string', 'email', 'Konu filtreleri (virgülle ayrılmış)', true),
    ('GMAIL_IMAP_AUTO_IMPORT', 'false', 'boolean', 'email', 'Eşleşen faturaları otomatik stok girişi yap', true)
ON CONFLICT (key) DO NOTHING;

-- 7. Updated_at trigger
CREATE OR REPLACE FUNCTION update_kts_incoming_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_kts_incoming_invoices_updated_at
    BEFORE UPDATE ON kts_incoming_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_kts_incoming_invoices_updated_at();
