-- Recipe Form Enhancements
-- Adds barcode, form fields, and lab manager role

-- 1. Add new columns to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS barcode VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS recipe_name_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS color_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS yarn_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS planning_date DATE,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS finish_date DATE,
ADD COLUMN IF NOT EXISTS batch_ratio VARCHAR(20),
ADD COLUMN IF NOT EXISTS process_wash_count INTEGER,
ADD COLUMN IF NOT EXISTS approved_by_manager UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS manager_approved_at TIMESTAMP WITH TIME ZONE;

-- 2. Add lab_manager role to users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'lab', 'lab_manager', 'production', 'warehouse'));

-- 3. Create index for barcode lookups
CREATE INDEX IF NOT EXISTS idx_recipes_barcode ON recipes(barcode);
CREATE INDEX IF NOT EXISTS idx_recipes_color_code ON recipes(color_code);
CREATE INDEX IF NOT EXISTS idx_recipes_recipe_name_no ON recipes(recipe_name_no);

-- 4. Create barcode sequence
CREATE SEQUENCE IF NOT EXISTS recipe_barcode_seq START WITH 1000;

-- 5. Create function to generate barcode
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
        
        -- Check if barcode exists
        SELECT EXISTS(SELECT 1 FROM recipes WHERE barcode = new_barcode) INTO barcode_exists;
        
        -- If unique, return it
        IF NOT barcode_exists THEN
            RETURN new_barcode;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to auto-generate barcode on insert
CREATE OR REPLACE FUNCTION set_recipe_barcode()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.barcode IS NULL THEN
        NEW.barcode := generate_recipe_barcode();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_recipe_barcode ON recipes;
CREATE TRIGGER trigger_set_recipe_barcode
    BEFORE INSERT ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION set_recipe_barcode();

-- 7. Add comments for documentation
COMMENT ON COLUMN recipes.barcode IS 'Unique barcode identifier (format: RTKS-YYYYMMDD-NNNN)';
COMMENT ON COLUMN recipes.recipe_name_no IS 'Recipe name/number from the form';
COMMENT ON COLUMN recipes.color_code IS 'Color code identifier';
COMMENT ON COLUMN recipes.yarn_code IS 'Yarn type code';
COMMENT ON COLUMN recipes.planning_date IS 'When recipe was planned';
COMMENT ON COLUMN recipes.start_date IS 'Production start date';
COMMENT ON COLUMN recipes.finish_date IS 'Production finish date';
COMMENT ON COLUMN recipes.batch_ratio IS 'Batch production ratio (e.g., 9/2)';
COMMENT ON COLUMN recipes.process_wash_count IS 'Number of wash processes';
COMMENT ON COLUMN recipes.approved_by_manager IS 'Lab manager who approved the recipe';
COMMENT ON COLUMN recipes.manager_approved_at IS 'When lab manager approved';

-- 8. Update existing recipes with placeholder barcodes (optional)
-- UPDATE recipes SET barcode = generate_recipe_barcode() WHERE barcode IS NULL;
