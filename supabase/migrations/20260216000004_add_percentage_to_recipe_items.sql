-- Migration: Add percentage column to kts_recipe_items
-- This is required by the RecipeEditor to store material ratios

ALTER TABLE IF EXISTS kts_recipe_items 
ADD COLUMN IF NOT EXISTS percentage DECIMAL(10,3) DEFAULT 0;

COMMENT ON COLUMN kts_recipe_items.percentage IS 'Malzemenin reçetedeki yüzde oranı';
