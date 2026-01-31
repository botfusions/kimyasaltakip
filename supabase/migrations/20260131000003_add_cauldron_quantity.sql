ALTER TABLE recipes ADD COLUMN cauldron_quantity DECIMAL(10, 2);
COMMENT ON COLUMN recipes.cauldron_quantity IS 'Total quantity of the cauldron/batch';
