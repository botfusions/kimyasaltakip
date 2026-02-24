-- Rename tables to KTS_ prefix
-- Usage: Copy and run this in Supabase SQL Editor

-- 1. Users
ALTER TABLE IF EXISTS users RENAME TO kts_users;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN ALTER INDEX idx_users_email RENAME TO idx_kts_users_email; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_role') THEN ALTER INDEX idx_users_role RENAME TO idx_kts_users_role; END IF; END $$;

-- 2. Products
ALTER TABLE IF EXISTS products RENAME TO kts_products;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_code') THEN ALTER INDEX idx_products_code RENAME TO idx_kts_products_code; END IF; END $$;

-- 3. Usage Types
ALTER TABLE IF EXISTS usage_types RENAME TO kts_usage_types;

-- 4. Recipes
ALTER TABLE IF EXISTS recipes RENAME TO kts_recipes;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recipes_product_id') THEN ALTER INDEX idx_recipes_product_id RENAME TO idx_kts_recipes_product_id; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recipes_status') THEN ALTER INDEX idx_recipes_status RENAME TO idx_kts_recipes_status; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recipes_order_code') THEN ALTER INDEX idx_recipes_order_code RENAME TO idx_kts_recipes_order_code; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recipes_customer_name') THEN ALTER INDEX idx_recipes_customer_name RENAME TO idx_kts_recipes_customer_name; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recipes_work_order_date') THEN ALTER INDEX idx_recipes_work_order_date RENAME TO idx_kts_recipes_work_order_date; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recipes_version_code') THEN ALTER INDEX idx_recipes_version_code RENAME TO idx_kts_recipes_version_code; END IF; END $$;

-- 5. Materials
ALTER TABLE IF EXISTS materials RENAME TO kts_materials;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_materials_code') THEN ALTER INDEX idx_materials_code RENAME TO idx_kts_materials_code; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_materials_category') THEN ALTER INDEX idx_materials_category RENAME TO idx_kts_materials_category; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_materials_cas_number') THEN ALTER INDEX idx_materials_cas_number RENAME TO idx_kts_materials_cas_number; END IF; END $$;

-- 6. Recipe Items
ALTER TABLE IF EXISTS recipe_items RENAME TO kts_recipe_items;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recipe_materials_recipe_id') THEN ALTER INDEX idx_recipe_materials_recipe_id RENAME TO idx_kts_recipe_items_recipe_id; END IF; END $$;

-- 7. Stock
ALTER TABLE IF EXISTS stock RENAME TO kts_stock;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_material_id') THEN ALTER INDEX idx_stock_material_id RENAME TO idx_kts_stock_material_id; END IF; END $$;

-- 8. Stock Movements
ALTER TABLE IF EXISTS stock_movements RENAME TO kts_stock_movements;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stock_movements_material_id') THEN ALTER INDEX idx_stock_movements_material_id RENAME TO idx_kts_stock_movements_material_id; END IF; END $$;

-- 9. Usage Rules
ALTER TABLE IF EXISTS usage_rules RENAME TO kts_usage_rules;

-- 10. Production Logs
ALTER TABLE IF EXISTS production_logs RENAME TO kts_production_logs;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_production_logs_batch_number') THEN ALTER INDEX idx_production_logs_batch_number RENAME TO idx_kts_production_logs_batch_number; END IF; END $$;

-- 11. Production Materials
ALTER TABLE IF EXISTS production_materials RENAME TO kts_production_materials;

-- 12. Settings
ALTER TABLE IF EXISTS settings RENAME TO kts_settings;

-- 13. Audit Logs
ALTER TABLE IF EXISTS audit_logs RENAME TO kts_audit_logs;

-- 14. Compliance Standards
ALTER TABLE IF EXISTS compliance_standards RENAME TO kts_compliance_standards;

-- 15. Restricted Substances
ALTER TABLE IF EXISTS restricted_substances RENAME TO kts_restricted_substances;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_restricted_substances_cas') THEN ALTER INDEX idx_restricted_substances_cas RENAME TO idx_kts_restricted_substances_cas; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_restricted_substances_standard') THEN ALTER INDEX idx_restricted_substances_standard RENAME TO idx_kts_restricted_substances_standard; END IF; END $$;

-- 16. Compliance Checks
ALTER TABLE IF EXISTS compliance_checks RENAME TO kts_compliance_checks;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_compliance_checks_recipe') THEN ALTER INDEX idx_compliance_checks_recipe RENAME TO idx_kts_compliance_checks_recipe; END IF; END $$;

-- 17. Compliance Documents
ALTER TABLE IF EXISTS compliance_documents RENAME TO kts_compliance_documents;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_compliance_documents_embedding') THEN ALTER INDEX idx_compliance_documents_embedding RENAME TO idx_kts_compliance_documents_embedding; END IF; END $$;
