-- KİMYASAL TAKİP - RLS Güvenlik Sertleştirmesi
-- 2026-02-26

-- 1. Mevcut "Public" politikaları temizle (Eski migrationlardan kalanlar)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND (policyname LIKE '%Public%' OR policyname LIKE '%public%')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "' || r.tablename || '"';
    END LOOP;
END $$;

-- 2. Yardımcı Fonksiyon: Mevcut kullanıcının rolünü al
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
    SELECT role FROM kts_users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. kts_users tablosu - Kullanıcı kendi profilini görebilir, admin her şeyi yapabilir
DROP POLICY IF EXISTS "Users can view own profile" ON kts_users;
CREATE POLICY "Users can view own profile" ON kts_users FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins have full access on users" ON kts_users;
CREATE POLICY "Admins have full access on users" ON kts_users FOR ALL 
    USING (get_user_role() = 'admin');

-- 4. kts_materials - Herkes görebilir, Admin ve Warehouse güncelleyebilir
DROP POLICY IF EXISTS "Authenticated users can view materials" ON kts_materials;
CREATE POLICY "Authenticated users can view materials" ON kts_materials FOR SELECT 
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin and Warehouse can manage materials" ON kts_materials;
CREATE POLICY "Admin and Warehouse can manage materials" ON kts_materials FOR ALL 
    USING (get_user_role() IN ('admin', 'warehouse'));

-- 5. kts_products - Herkes görebilir, Admin ve Lab güncelleyebilir
DROP POLICY IF EXISTS "Authenticated users can view products" ON kts_products;
CREATE POLICY "Authenticated users can view products" ON kts_products FOR SELECT 
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin and Lab can manage products" ON kts_products;
CREATE POLICY "Admin and Lab can manage products" ON kts_products FOR ALL 
    USING (get_user_role() IN ('admin', 'lab'));

-- 6. kts_recipes - Herkes görebilir, Lab yönetir
DROP POLICY IF EXISTS "Authenticated users can view recipes" ON kts_recipes;
CREATE POLICY "Authenticated users can view recipes" ON kts_recipes FOR SELECT 
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin and Lab can manage recipes" ON kts_recipes;
CREATE POLICY "Admin and Lab can manage recipes" ON kts_recipes FOR ALL 
    USING (get_user_role() IN ('admin', 'lab'));

-- 7. kts_stock ve kts_stock_movements - Herkes görebilir, Warehouse ve Admin yönetir
DROP POLICY IF EXISTS "Authenticated users can view stock" ON kts_stock;
CREATE POLICY "Authenticated users can view stock" ON kts_stock FOR SELECT 
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin and Warehouse can manage stock" ON kts_stock;
CREATE POLICY "Admin and Warehouse can manage stock" ON kts_stock FOR ALL 
    USING (get_user_role() IN ('admin', 'warehouse'));

DROP POLICY IF EXISTS "Authenticated users can view movements" ON kts_stock_movements;
CREATE POLICY "Authenticated users can view movements" ON kts_stock_movements FOR SELECT 
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin and Warehouse can manage movements" ON kts_stock_movements;
CREATE POLICY "Admin and Warehouse can manage movements" ON kts_stock_movements FOR ALL 
    USING (get_user_role() IN ('admin', 'warehouse'));

-- 8. kts_production_logs - Herkes görebilir, Production ve Admin yönetir
DROP POLICY IF EXISTS "Authenticated users can view production logs" ON kts_production_logs;
CREATE POLICY "Authenticated users can view production logs" ON kts_production_logs FOR SELECT 
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin and Production can manage production logs" ON kts_production_logs;
CREATE POLICY "Admin and Production can manage production logs" ON kts_production_logs FOR ALL 
    USING (get_user_role() IN ('admin', 'production'));

-- 9. kts_compliance_* - Lab ve Admin tam yetki, diğerleri görüntüleme
DROP POLICY IF EXISTS "Authenticated users can view compliance" ON kts_compliance_standards;
CREATE POLICY "Authenticated users can view compliance" ON kts_compliance_standards FOR SELECT 
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin and Lab can manage compliance" ON kts_compliance_standards;
CREATE POLICY "Admin and Lab can manage compliance" ON kts_compliance_standards FOR ALL 
    USING (get_user_role() IN ('admin', 'lab'));
