// Run migration via Supabase Management API (pg-meta)
// Uses service role key for authentication

const SUPABASE_URL = 'https://lsppsvspgpifuirzxqic.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcHBzdnNwZ3BpZnVpcnp4cWljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTkxNzQzOSwiZXhwIjoyMDY1NDkzNDM5fQ.15UoyVZkOlLxxjNNc7h73jEKOOa8enUab7X1gkyQ_4E';

const fs = require('fs');

async function runSQL(sql) {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ query: sql })
    });
    return resp;
}

async function main() {
    // Use the pg-meta query endpoint
    const sql = fs.readFileSync(
        'c:/Users/user/Downloads/Z.ai_claude code/KİMYASAL TAKİP/supabase/migrations/20260224000001_incoming_invoices.sql',
        'utf-8'
    );

    console.log('Attempting to run migration via Supabase pg-meta API...');

    // Try the query endpoint that newer Supabase versions expose
    const resp = await fetch(`${SUPABASE_URL}/pg/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ query: sql })
    });

    if (resp.ok) {
        const data = await resp.json();
        console.log('✅ Migration applied!', JSON.stringify(data));
    } else {
        const text = await resp.text();
        console.log(`Status: ${resp.status}`);
        console.log('Response:', text.substring(0, 500));
        
        // Fallback: try individual statements
        console.log('\nTrying individual SQL statements...');
        await runIndividual();
    }
}

async function runIndividual() {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
        db: { schema: 'public' }
    });

    // Step 1: Create exec_sql function first
    console.log('Step 1: Creating helper function...');
    
    // We'll try inserting test data to verify table exists after creation
    const statements = [
        // Create main table
        `CREATE TABLE IF NOT EXISTS kts_incoming_invoices (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email_uid TEXT NOT NULL,
            email_from TEXT,
            email_subject TEXT,
            email_date TIMESTAMPTZ,
            email_body_preview TEXT,
            attachment_filename TEXT NOT NULL,
            attachment_type TEXT NOT NULL DEFAULT 'xml',
            attachment_size INTEGER,
            attachment_storage_path TEXT,
            attachment_content TEXT,
            parsed_data JSONB,
            invoice_number TEXT,
            supplier_name TEXT,
            invoice_date DATE,
            total_amount NUMERIC(12,2),
            currency TEXT DEFAULT 'TRY',
            line_count INTEGER DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'pending',
            match_result JSONB,
            matched_count INTEGER DEFAULT 0,
            unmatched_count INTEGER DEFAULT 0,
            imported_at TIMESTAMPTZ,
            imported_by UUID REFERENCES auth.users(id),
            import_notes TEXT,
            error_message TEXT,
            retry_count INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(email_uid, attachment_filename)
        )`,
        // Create log table
        `CREATE TABLE IF NOT EXISTS kts_email_fetch_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            fetched_at TIMESTAMPTZ DEFAULT NOW(),
            emails_found INTEGER DEFAULT 0,
            attachments_found INTEGER DEFAULT 0,
            invoices_created INTEGER DEFAULT 0,
            errors TEXT[],
            duration_ms INTEGER,
            status TEXT DEFAULT 'success'
        )`,
    ];

    // We can't run DDL via REST API directly
    // Let's check if we need to create a migration function in the database
    console.log('⚠️ Cannot run DDL via Supabase REST API.');
    console.log('');
    console.log('📋 Please run the migration SQL in Supabase Dashboard SQL Editor:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/lsppsvspgpifuirzxqic/sql/new');
    console.log('   2. Copy the SQL from: supabase/migrations/20260224000001_incoming_invoices.sql');
    console.log('   3. Click "Run" to execute');
    console.log('');
    console.log('Or run via supabase CLI:');
    console.log('   npx supabase db push --db-url postgresql://postgres.lsppsvspgpifuirzxqic:<PASSWORD>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres');

    // Try via settings insert to verify connection works
    const { data, error } = await supabase.from('kts_settings').select('key').eq('key', 'GMAIL_IMAP_ENABLED');
    if (!error && data && data.length > 0) {
        console.log('\n✅ Gmail IMAP settings already exist in kts_settings');
    } else {
        // Insert settings
        const settingsToInsert = [
            { key: 'GMAIL_IMAP_ENABLED', value: 'false', data_type: 'boolean', category: 'email', description: 'Gmail IMAP fatura alma aktif mi?', is_editable: true },
            { key: 'GMAIL_IMAP_USER', value: '', data_type: 'string', category: 'email', description: 'Gmail e-posta adresi', is_editable: true },
            { key: 'GMAIL_IMAP_PASSWORD', value: '', data_type: 'string', category: 'email', description: 'Gmail uygulama şifresi (App Password)', is_editable: true },
            { key: 'GMAIL_IMAP_FOLDER', value: 'INBOX', data_type: 'string', category: 'email', description: 'Kontrol edilecek klasör', is_editable: true },
            { key: 'GMAIL_IMAP_SEARCH_FROM', value: '', data_type: 'string', category: 'email', description: 'Sadece bu adreslerden gelen e-postalar (virgülle ayrılmış, boş=hepsi)', is_editable: true },
            { key: 'GMAIL_IMAP_SEARCH_SUBJECT', value: 'fatura,invoice,e-fatura', data_type: 'string', category: 'email', description: 'Konu filtreleri (virgülle ayrılmış)', is_editable: true },
            { key: 'GMAIL_IMAP_AUTO_IMPORT', value: 'false', data_type: 'boolean', category: 'email', description: 'Eşleşen faturaları otomatik stok girişi yap', is_editable: true },
        ];

        const { error: insertError } = await supabase.from('kts_settings').upsert(settingsToInsert, { onConflict: 'key' });
        if (insertError) {
            console.log('❌ Settings insert error:', insertError.message);
        } else {
            console.log('✅ Gmail IMAP settings inserted into kts_settings');
        }
    }
}

main().catch(err => console.error('Fatal:', err.message));
