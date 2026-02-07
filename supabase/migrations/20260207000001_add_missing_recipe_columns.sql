-- Migration: recipes tablosuna eksik kolonları ekle
-- RecipeEditor'dan gönderilen ancak veritabanına yazılmayan alanlar

-- Sipariş bilgileri
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS order_code TEXT,
ADD COLUMN IF NOT EXISTS color_name TEXT,
ADD COLUMN IF NOT EXISTS process_info TEXT,
ADD COLUMN IF NOT EXISTS total_weight DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS machine_code TEXT,
ADD COLUMN IF NOT EXISTS work_order_date DATE,
ADD COLUMN IF NOT EXISTS bath_volume DECIMAL(10,2);

-- Müşteri bilgileri
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS sip_no TEXT,
ADD COLUMN IF NOT EXISTS customer_ref_no TEXT,
ADD COLUMN IF NOT EXISTS customer_order_no TEXT,
ADD COLUMN IF NOT EXISTS customer_sip_mt DECIMAL(10,2);

-- Ürün bilgileri
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS yarn_type TEXT,
ADD COLUMN IF NOT EXISTS lot_no TEXT,
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS c_cozg TEXT;

-- İndeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_recipes_order_code ON recipes(order_code);
CREATE INDEX IF NOT EXISTS idx_recipes_customer_name ON recipes(customer_name);
CREATE INDEX IF NOT EXISTS idx_recipes_work_order_date ON recipes(work_order_date);

-- Yorum ekle
COMMENT ON COLUMN recipes.order_code IS 'Sipariş kodu';
COMMENT ON COLUMN recipes.color_name IS 'Renk adı';
COMMENT ON COLUMN recipes.work_order_date IS 'İş emri tarihi';
COMMENT ON COLUMN recipes.customer_name IS 'Müşteri adı';
COMMENT ON COLUMN recipes.yarn_type IS 'İplik tipi';
