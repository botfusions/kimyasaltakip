-- Fix functions with hardcoded table names and ensure RLS is enabled

-- 1. Fix generate_recipe_barcode function (references 'recipes')
CREATE OR REPLACE FUNCTION generate_recipe_barcode()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_barcode VARCHAR(50);
    barcode_exists BOOLEAN;
BEGIN
    LOOP
        -- Format: RTKS-YYYYMMDD-NNNN
        new_barcode := 'RTKS-' || 
                       TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                       LPAD(nextval('recipe_barcode_seq')::TEXT, 4, '0');
        
        -- Check if barcode exists (Updated table name kts_recipes)
        SELECT EXISTS(SELECT 1 FROM kts_recipes WHERE barcode = new_barcode) INTO barcode_exists;
        
        -- If unique, return it
        IF NOT barcode_exists THEN
            RETURN new_barcode;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix update_stock_after_movement function (references 'stock')
CREATE OR REPLACE FUNCTION update_stock_after_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Updated table name kts_stock
    UPDATE kts_stock 
    SET quantity = quantity + NEW.quantity,
        last_movement_at = now(),
        last_updated = now(),
        updated_by = NEW.created_by
    WHERE material_id = NEW.material_id;
    
    IF NOT FOUND THEN
        -- Updated table name kts_stock
        INSERT INTO kts_stock (material_id, quantity, updated_by)
        VALUES (NEW.material_id, NEW.quantity, NEW.created_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Ensure RLS is ENABLED for all tables (Fix UNRESTRICTED warning)
ALTER TABLE IF EXISTS kts_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_usage_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_usage_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_production_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_compliance_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_restricted_substances ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kts_compliance_documents ENABLE ROW LEVEL SECURITY;

-- 4. Re-apply policies (Postgres renames them attached to table, but good to be safe if they were dropped)
-- Note: Existing policies should have been carried over. Only adding if missing is complex in SQL without checks.
-- Assuming policies carried over. Only RLS enable is strictly required if it was disabled.
