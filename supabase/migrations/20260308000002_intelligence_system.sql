-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Intelligence Sources Table (Takip Edilen Web Siteleri)
CREATE TABLE IF NOT EXISTS kts_intelligence_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    category TEXT DEFAULT 'general', -- 'standards', 'chemicals', 'regulations'
    is_active BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMPTZ,
    sync_interval_hours INTEGER DEFAULT 24,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for sources
ALTER TABLE kts_intelligence_sources ENABLE ROW LEVEL SECURITY;

-- Policies for sources (IDEMPOTENT)
DROP POLICY IF EXISTS "Admins can manage intelligence sources" ON kts_intelligence_sources;
CREATE POLICY "Admins can manage intelligence sources" 
ON kts_intelligence_sources FOR ALL 
USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "Authenticated users can view intelligence sources" ON kts_intelligence_sources;
CREATE POLICY "Authenticated users can view intelligence sources" 
ON kts_intelligence_sources FOR SELECT 
TO authenticated 
USING (true);

-- 2. Intelligence Data Table (Kazınan Veriler ve Vektörler)
CREATE TABLE IF NOT EXISTS kts_intelligence_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES kts_intelligence_sources(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Scraped Markdown content
    url TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding VECTOR(384), -- Vector for semantic search (Local all-MiniLM-L6-v2 size)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create an index for vector similarity search
CREATE INDEX ON kts_intelligence_data USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable RLS for data
ALTER TABLE kts_intelligence_data ENABLE ROW LEVEL SECURITY;

-- Policies for data (IDEMPOTENT)
DROP POLICY IF EXISTS "Admins can manage intelligence data" ON kts_intelligence_data;
CREATE POLICY "Admins can manage intelligence data" 
ON kts_intelligence_data FOR ALL 
USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "Authenticated users can search intelligence data" ON kts_intelligence_data;
CREATE POLICY "Authenticated users can search intelligence data" 
ON kts_intelligence_data FOR SELECT 
TO authenticated 
USING (true);

-- 3. Function for vector search (RAG için kullanılacak)
CREATE OR REPLACE FUNCTION match_intelligence_data (
  query_embedding VECTOR(384),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  source_id UUID,
  title TEXT,
  content TEXT,
  url TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kts_intelligence_data.id,
    kts_intelligence_data.source_id,
    kts_intelligence_data.title,
    kts_intelligence_data.content,
    kts_intelligence_data.url,
    1 - (kts_intelligence_data.embedding <=> query_embedding) AS similarity
  FROM kts_intelligence_data
  WHERE 1 - (kts_intelligence_data.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
