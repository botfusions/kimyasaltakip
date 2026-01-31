-- Migration to match recipe image fields
-- 1. Make product_id nullable as we moving to a direct order/recipe model
ALTER TABLE recipes ALTER COLUMN product_id DROP NOT NULL;

-- 2. Add new columns found in the recipe image
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS order_code TEXT, -- Reçete İş Emri No
ADD COLUMN IF NOT EXISTS color_name TEXT, -- Renk
ADD COLUMN IF NOT EXISTS process_info TEXT, -- Proses
ADD COLUMN IF NOT EXISTS total_weight DECIMAL(10,2), -- Toplam Kg
ADD COLUMN IF NOT EXISTS machine_code TEXT, -- Kazan Kodu
ADD COLUMN IF NOT EXISTS work_order_date DATE, -- İş Emri Tarihi
ADD COLUMN IF NOT EXISTS bath_volume DECIMAL(10,2), -- Banyo Miktar
ADD COLUMN IF NOT EXISTS customer_name TEXT, -- Müşteri
ADD COLUMN IF NOT EXISTS sip_no TEXT, -- Sip. No
ADD COLUMN IF NOT EXISTS customer_ref_no TEXT, -- Ref. No
ADD COLUMN IF NOT EXISTS customer_order_no TEXT, -- M. Sip No
ADD COLUMN IF NOT EXISTS customer_sip_mt DECIMAL(10,2), -- Sip Mt
ADD COLUMN IF NOT EXISTS yarn_type TEXT, -- İplik (description)
ADD COLUMN IF NOT EXISTS lot_no TEXT, -- Lot No
ADD COLUMN IF NOT EXISTS brand_name TEXT, -- Marka
ADD COLUMN IF NOT EXISTS c_cozg TEXT; -- C/Çözg
