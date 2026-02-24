-- Add version_code to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS version_code VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_recipes_version_code ON recipes(version_code);
COMMENT ON COLUMN recipes.version_code IS 'Recipe version code (e.g. V-123456789)';
