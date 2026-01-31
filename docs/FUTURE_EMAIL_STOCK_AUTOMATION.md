# Future Feature: Automated Stock Entry via Email (IMAP + OCR/XML)

> [!NOTE]
> This feature was designed but deferred to a future version. This document preserves the implementation plan and architecture.

## Overview
An automated system that listens to a dedicated email address, extracts invoice data (XML/PDF), and processes it into "Stock Drafts" for user approval.

## Architecture

### 1. Backend Listener (`email-listener.ts`)
- **Libraries**: `imap-simple`, `mailparser`
- **Function**: Connects to IMAP, listens for unseen emails, downloads attachments.
- **Security**: Uses env vars `IMAP_HOST`, `IMAP_USER`, `IMAP_PASSWORD`.

### 2. Invoice Parsing (`invoice-parser.ts`)
- **Strategy Pattern**:
  - `XmlInvoiceParser`: Uses `fast-xml-parser` for UBL/E-Invoice XMLs (High accuracy).
  - `PdfInvoiceParser`: Uses `pdf-parse` for digital PDFs (Medium accuracy, requires regex mapping).

### 3. Database Schema (`stock_drafts`)
Temporary table to hold parsed data before it affects actual stock levels.

```sql
CREATE TABLE stock_drafts (
    id UUID PRIMARY KEY,
    source_email VARCHAR(255),
    parsed_data JSONB, -- { items: [{ name: "Chemical A", quantity: 100, unit: "kg" }] }
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    invoice_file_path VARCHAR(500)
);
```

### 4. User Interface
- **Incoming Queue**: A tab in the Stock Entry page showing pending drafts.
- **Mapping Interface**: User maps "Invoice Item Name" -> "System Material Name" manually if fuzzy match fails.

## Dependencies Required
```bash
npm install imap-simple mailparser fast-xml-parser pdf-parse
npm install -D @types/imap-simple @types/mailparser
```

## Next Steps for Implementation
1. Install dependencies.
2. Apply `stock_drafts` migration.
3. Implement `EmailService` class.
4. Build the "Incoming Queue" UI.
