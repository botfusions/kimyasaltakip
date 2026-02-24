# CODEBASE.md

> **Auto-generated project context.** Refreshed on every session start.

---

## Project Info

| Property | Value |
|----------|-------|
| **Project** | `KİMYASAL TAKİP` |
| **Framework** | `nextjs` |
| **Type** | `node` |
| **OS** | Windows |
| **Path** | `c:\Users\user\Downloads\Z.ai_claude code\KİMYASAL TAKİP` |

---

## Project Structure

> **Legend:** `file.ts <- A.tsx, B.tsx` = This file is **imported by** A.tsx and B.tsx.
> Directories with `[N files: ...]` are summarized to reduce size.
> [STATS] Showing 146 files. 4 dirs summarized, 5 dirs excluded (node_modules, etc.)


```
.github/ [1 files: 1 .yml]
archive/
  CLEANUP_LOG.md
  Dijital Reçete Tabanlı Boya & Kimyasal Tüketim İzleme Sistemi.docx
  PLAN_draft.md
  migration_fix_reference_id.sql
  python_experiments/
    ocr_invoice.py
    read-pdf-pymupdf.py
    read-pdf.py
    recete-form-text.txt
    reçete.html
    reçete.pdf
docs/ [16 files: 14 .md, 1 .csv, 1 .json]
fatura/
  7350213672_RUD2025000023792.pdf
  MRLS.pdf
  OEKOTEX.pdf
  RUD2025000017302-D5366353-0A32-44C1-95E8-DCDE9EF5755C.xml
  reçete (1).html
frontend/
  .env.local
  .env.local.example
  .eslintrc.json
  .gitignore
  README.md
  apply_schema_fix_draft.js
  check_role.js
  check_test_material.js
  create_test_user.js
  debug_recipe_creation.js
  list_users.js
  next.config.mjs
  package-lock.json
  package.json
  postcss.config.js
  public/ [1 files: 1 .html]
  scripts/
    check_test_state.mjs
    draft_execute.js
    fix_schema.mjs
    generate_migration.js
    get_usage_types.mjs
    import-chemicals.js
    import_data_via_api.js
    inspect_schema.mjs
    invoice_import.sql
    process-invoices.js
    seed_demo_v2.mjs
  src/
    app/
      actions/
        auth.ts ← Header.tsx, RecipeManagementClient.tsx, layout.tsx +9 more
        compliance.ts ← MrlsCheckModal.tsx, MrlsCheckClient.tsx
        expert.ts ← ExpertConsultantClient.tsx
        invoices.ts ← InvoiceImportClient.tsx, InvoiceListClient.tsx, page.tsx
        materials.ts ← MaterialModal.tsx, MaterialsManagementClient.tsx, RecipeEditor.tsx +1 more
        products.ts ← ProductModal.tsx, ProductsManagementClient.tsx, page.tsx +1 more
        recipes.ts ← MrlsCheckModal.tsx, RecipeDetailsView.tsx, RecipeEditor.tsx +5 more
        reports.ts
        settings.ts ← SettingsClient.tsx, recipes.ts, page.tsx
        stock.ts ← MaterialsManagementClient.tsx, StockMovementForm.tsx, page.tsx +1 more
        test-email.ts ← page.tsx
        users.ts ← UserManagementClient.tsx, UserModal.tsx, page.tsx
      api/
        debug-recipe/
          route.ts
        ocr/
          route.ts
        seed-demo/
          route.ts
        seed-demo-v2/
          route.ts
      dashboard/
        compliance/
          MrlsCheckClient.tsx ← page.tsx
          page.tsx
        expert/
          page.tsx
        invoices/
          import/
            page.tsx
          page.tsx
        layout.tsx
        materials/
          page.tsx
        page.tsx
        production/
          page.tsx
        products/
          page.tsx
        recipes/
          [id]/
            edit/
              page.tsx
            page.tsx
          new/
            page.tsx
          page.tsx
        reports/
          page.tsx
        settings/
          page.tsx
          test-email/
            page.tsx
        stock/
          movement/
            new/
              page.tsx
          page.tsx
        users/
          page.tsx
      globals.css
      layout.tsx
      login/
        page.tsx
      page.tsx
    components/
      ThemeProvider.tsx ← layout.tsx
      ThemeToggle.tsx ← Header.tsx
      dashboard/
        Header.tsx ← layout.tsx
        Sidebar.tsx ← layout.tsx
      expert/
        ExpertConsultantClient.tsx ← page.tsx
      invoices/
        InvoiceImportClient.tsx ← page.tsx
        InvoiceListClient.tsx ← page.tsx
      materials/
        MaterialModal.tsx ← MaterialsManagementClient.tsx
        MaterialsManagementClient.tsx ← page.tsx
      products/
        ProductModal.tsx ← ProductsManagementClient.tsx
        ProductsManagementClient.tsx ← page.tsx
      recipes/
        MrlsCheckModal.tsx ← RecipeDetailsView.tsx
        RecipeDetailsView.tsx ← page.tsx
        RecipeEditor.tsx ← page.tsx, page.tsx
        RecipeFormPDF.tsx
        RecipeManagementClient.tsx ← page.tsx
        SignatureVerificationModal.tsx ← RecipeDetailsView.tsx, RecipeManagementClient.tsx
      settings/
        SettingsClient.tsx
      stock/
        StockManagementClient.tsx ← page.tsx
        StockMovementForm.tsx ← page.tsx
      ui/
        Button.tsx ← Header.tsx, ExpertConsultantClient.tsx, InvoiceImportClient.tsx +16 more
        Input.tsx ← MaterialModal.tsx, MaterialsManagementClient.tsx, ProductModal.tsx +9 more
        Modal.tsx ← MaterialModal.tsx, ProductModal.tsx, RecipeEditor.tsx +2 more
        Table.tsx ← UserManagementClient.tsx
      users/
        UserManagementClient.tsx ← page.tsx
        UserModal.tsx ← UserManagementClient.tsx
    lib/
      barcode.ts ← recipe-pdf.ts, RecipeDetailsView.tsx, RecipeFormPDF.tsx
      email.ts ← recipes.ts, reports.ts, test-email.ts
      invoice/
        MatchingEngine.ts ← invoice-parser.ts
        OcrParser.ts ← invoice-parser.ts
        XmlParser.ts ← invoice-parser.ts
      invoice-parser.ts ← OcrParser.ts, XmlParser.ts
      pdf/
        pdf-provider.ts ← recipe-pdf.ts
        recipe-pdf.ts ← RecipeDetailsView.tsx
      reports.ts ← reports.ts
      string-utils.ts ← MatchingEngine.ts
      supabase/
        client.ts
        middleware.ts ← middleware.ts
        server.ts ← email.ts, reports.ts
      telegram.ts ← recipes.ts
      utils.ts ← Sidebar.tsx, Button.tsx, Input.tsx +2 more
      validations/
        auth.ts ← index.ts
        index.ts ← read-pdf-ocr.py
        material.ts ← index.ts
        product.ts ← index.ts
        recipe.ts ← index.ts
        stock.ts ← index.ts
        user.ts ← index.ts
    middleware.ts
    types/
      database.types.ts
      index.ts ← read-pdf-ocr.py
  tailwind.config.ts
  test-email-script.mjs
  try_rpc_exec.js
  tsconfig.json
  tsconfig.tsbuildinfo
  verify_refactor.js
  verify_schema_status.js
scripts/
  check_data.js
  get_ids.js
  refactor_db_prefix.js
  seed_test_data.js
  verify_db_refactor.js
supabase/
  migrations/ [21 files: 20 .sql, 1 .bak]
tessdata/
  eng.traineddata
  tur.traineddata
```


## File Dependencies

> Scanned 123 files

### API Endpoints Used

```
/api/ocr
```

### High-Impact Files

*Files imported by multiple other files:*

| File | Imported by |
|------|-------------|
| `src/components/ui/Button` | 19 files |
| `src/lib/supabase/server` | 14 files |
| `src/app/actions/auth` | 12 files |
| `src/components/ui/Input` | 12 files |
| `frontend/src/app/actions/auth` | 9 files |


---

*Auto-generated by Maestro session hooks.*
