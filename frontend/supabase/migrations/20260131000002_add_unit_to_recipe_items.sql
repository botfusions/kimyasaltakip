ALTER TABLE recipe_items ADD COLUMN unit VARCHAR(20) DEFAULT 'kg';
COMMENT ON COLUMN recipe_items.unit IS 'Unit of measurement for the item quantity';
