-- Create chemical_products table
CREATE TABLE IF NOT EXISTS chemical_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    manufacturer TEXT,
    category TEXT,
    general_function TEXT,
    type TEXT,
    target_age_under_3 BOOLEAN,
    target_age_over_3 BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for common searches
CREATE INDEX IF NOT EXISTS idx_chemical_products_name ON chemical_products(product_name);
CREATE INDEX IF NOT EXISTS idx_chemical_products_manufacturer ON chemical_products(manufacturer);
CREATE INDEX IF NOT EXISTS idx_chemical_products_category ON chemical_products(category);

-- Enable Row Level Security (RLS)
ALTER TABLE chemical_products ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (allow everyone to read for now, or authenticated users)
-- Since this is reference data for the AI, it should be readable by authenticated users (admin/lab)
CREATE POLICY "Enable read access for authenticated users" ON chemical_products
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy for insert/update only for service_role (for the import script) or admins
CREATE POLICY "Enable insert for service_role only" ON chemical_products
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Add a text search index for better AI retrieval
-- We concatenate relevant fields into a generated column or just use a GIN index on vector
-- For simplicity and standard Postgres FTS:
CREATE INDEX IF NOT EXISTS idx_chemical_products_fts ON chemical_products USING GIN (to_tsvector('english', product_name || ' ' || coalesce(manufacturer, '') || ' ' || coalesce(category, '') || ' ' || coalesce(general_function, '')));
