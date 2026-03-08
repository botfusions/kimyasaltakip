-- KTS - Ek RLS Politikaları ve Güvenlik Sertleştirmesi
-- 2026-03-08

-- Yardımcı Fonksiyon: Mevcut kullanıcının rolünü al
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
    SELECT role FROM kts_users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;


-- 1. kts_recipe_items - Authenticated users can view, Admin/Lab can manage
ALTER TABLE kts_recipe_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view recipe items" ON kts_recipe_items;
CREATE POLICY "Authenticated users can view recipe items" ON kts_recipe_items FOR SELECT 
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin and Lab can manage recipe items" ON kts_recipe_items;
CREATE POLICY "Admin and Lab can manage recipe items" ON kts_recipe_items FOR ALL 
    USING (get_user_role() IN ('admin', 'lab'));

-- 2. kts_production_materials - Authenticated users can view, Admin/Production can manage
ALTER TABLE kts_production_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view production materials" ON kts_production_materials;
CREATE POLICY "Authenticated users can view production materials" ON kts_production_materials FOR SELECT 
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin and Production can manage production materials" ON kts_production_materials;
CREATE POLICY "Admin and Production can manage production materials" ON kts_production_materials FOR ALL 
    USING (get_user_role() IN ('admin', 'production'));

-- 3. kts_audit_logs - Admin only can view
ALTER TABLE kts_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all audit logs" ON kts_audit_logs;
CREATE POLICY "Admins can view all audit logs" ON kts_audit_logs FOR SELECT 
    USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "System can insert audit logs" ON kts_audit_logs;
CREATE POLICY "System can insert audit logs" ON kts_audit_logs FOR INSERT 
    WITH CHECK (true); -- Server Actions uses service_role often, but for consistency

-- 4. kts_usage_types - Authenticated users can view, Admin only can manage
ALTER TABLE kts_usage_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view usage types" ON kts_usage_types;
CREATE POLICY "Authenticated users can view usage types" ON kts_usage_types FOR SELECT 
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin can manage usage types" ON kts_usage_types;
CREATE POLICY "Admin can manage usage types" ON kts_usage_types FOR ALL 
    USING (get_user_role() = 'admin');

-- 5. kts_compliance_checks - Authenticated users can view, Admin/Lab can manage
ALTER TABLE kts_compliance_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view compliance checks" ON kts_compliance_checks;
CREATE POLICY "Authenticated users can view compliance checks" ON kts_compliance_checks FOR SELECT 
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin and Lab can manage compliance checks" ON kts_compliance_checks;
CREATE POLICY "Admin and Lab can manage compliance checks" ON kts_compliance_checks FOR ALL 
    USING (get_user_role() IN ('admin', 'lab'));
