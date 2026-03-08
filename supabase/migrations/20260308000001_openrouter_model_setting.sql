-- Add OpenRouter Model setting
INSERT INTO kts_settings (key, value, description, category)
VALUES (
    'OPENROUTER_MODEL', 
    'google/gemini-3-flash-preview', 
    'OpenRouter üzerinden kullanılacak yapay zeka modeli (örn: google/gemini-3-flash-preview, openai/gpt-4o)', 
    'ai'
)
ON CONFLICT (key) DO NOTHING;
