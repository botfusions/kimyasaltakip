-- Add initial system settings
INSERT INTO settings (key, value, data_type, category, description, is_editable)
VALUES 
('GOOGLE_GENERATIVE_AI_API_KEY', '', 'string', 'api', 'Gemini AI Modeli için API Anahtarı', true),
('SYSTEM_DYE_EXPERT_ENABLED', 'true', 'boolean', 'general', 'Uzman Danışman modülünü aktif eder', true),
('MAX_RECIPE_VERSION', '10', 'number', 'general', 'Bir ürün için saklanabilecek maksimum reçete versiyonu', true)
ON CONFLICT (key) DO NOTHING;
