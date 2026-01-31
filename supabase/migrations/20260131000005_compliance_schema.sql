-- Enable pgvector extension for RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Add CAS Number to materials table (Chemicals)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'cas_number') THEN
        ALTER TABLE materials ADD COLUMN cas_number VARCHAR(50);
        CREATE INDEX idx_materials_cas_number ON materials(cas_number);
        COMMENT ON COLUMN materials.cas_number IS 'Chemical Abstracts Service number for substance identification';
    END IF;
END $$;

-- 2. Compliance Standards (e.g., AFIRM RSL, BlueSign, Brand Lists)
CREATE TABLE IF NOT EXISTS compliance_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Restricted Substances (The actual rules: CAS -> Limit)
CREATE TABLE IF NOT EXISTS restricted_substances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_id UUID NOT NULL REFERENCES compliance_standards(id) ON DELETE CASCADE,
    cas_number VARCHAR(50) NOT NULL,
    chemical_name VARCHAR(255) NOT NULL,
    limit_value DECIMAL(10,3), -- e.g., 50.0
    limit_unit VARCHAR(50), -- e.g., 'mg/kg', 'ppm'
    measurement_method VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(standard_id, cas_number)
);
CREATE INDEX IF NOT EXISTS idx_restricted_substances_cas ON restricted_substances(cas_number);
CREATE INDEX IF NOT EXISTS idx_restricted_substances_standard ON restricted_substances(standard_id);

-- 4. Compliance Checks History (Audit trail of checks performed)
CREATE TABLE IF NOT EXISTS compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES recipes(id),
    standard_id UUID REFERENCES compliance_standards(id),
    status VARCHAR(50) CHECK (status IN ('pass', 'fail', 'warning')),
    report JSONB, -- Detailed items that failed
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    checked_by UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_recipe ON compliance_checks(recipe_id);

-- 5. Compliance Documents (For RAG/AI Search)
CREATE TABLE IF NOT EXISTS compliance_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_id UUID REFERENCES compliance_standards(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    embedding vector(1536), -- OpenAI embedding size
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_embedding ON compliance_documents USING ivfflat (embedding vector_cosine_ops);

-- 6. Add RLS Policies
ALTER TABLE compliance_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE restricted_substances ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;

-- Public read access for now (can refine later)
CREATE POLICY "Public read access" ON compliance_standards FOR SELECT USING (true);
CREATE POLICY "Public read access" ON restricted_substances FOR SELECT USING (true);
CREATE POLICY "Public read access" ON compliance_documents FOR SELECT USING (true);
CREATE POLICY "Users can see checks" ON compliance_checks FOR SELECT USING (true);
CREATE POLICY "Users can insert checks" ON compliance_checks FOR INSERT WITH CHECK (auth.uid() = checked_by);
