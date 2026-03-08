-- Email ve Raporlama Ayarları
INSERT INTO kts_settings (key, value, data_type, category, description, is_editable)
VALUES 
('RESEND_API_KEY', 're_imv7Zsfa_7tD72N9B2g98B2ypdwUzmwNC', 'string', 'email', 'Resend Email API Anahtarı', true),
('EMAIL_FROM_ADDRESS', 'onboarding@resend.dev', 'string', 'email', 'Giden email adresi (Resend doğrulanmış domain)', true),
('REPORT_RECEIVER_EMAILS', 'aziz.guc@goldstarteks.com', 'string', 'email', 'Rapor alıcı email adresleri (virgülle ayrılmış)', true),
('GMAIL_IMAP_ENABLED', 'true', 'boolean', 'email', 'Gmail IMAP fatura alma aktif mi?', true),
('GMAIL_IMAP_USER', 'botsfatura@gmail.com', 'string', 'email', 'Gmail e-posta adresi', true)
ON CONFLICT (key) DO UPDATE 
SET 
    value = EXCLUDED.value,
    updated_at = NOW();
