-- Fix 1: Rename table to match backend code
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'recipe_materials') THEN
        ALTER TABLE recipe_materials RENAME TO recipe_items;
    END IF;
END $$;

-- Fix 2: Add unit column to recipe_items (if not exists)
ALTER TABLE recipe_items 
ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'kg';

-- Fix 3: Add cauldron_quantity to recipes (if not exists)
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS cauldron_quantity DECIMAL(10,3);
