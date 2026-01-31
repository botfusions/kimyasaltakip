-- Seed Data

INSERT INTO usage_types (name, description, color_code) 
VALUES
('İç Mekan', 'İç mekan kullanımı için', '#4CAF50'),
('Dış Mekan', 'Dış mekan kullanımı (UV)', '#FF9800'),
('Teknik Tekstil', 'Endüstriyel', '#2196F3'),
('Hijyenik', 'Hijyen gerektiren', '#9C27B0'),
('Bebek Ürünleri', 'Bebek/Çocuk', '#E91E63')
ON CONFLICT (name) DO NOTHING;

INSERT INTO settings (key, value, data_type, category, description) 
VALUES
('stock.critical_threshold_default', '10', 'number', 'stock', 'Varsayılan kritik stok eşiği (kg)'),
('email.notifications_enabled', 'true', 'boolean', 'notifications', 'Email bildirimleri aktif mi?'),
('report.auto_generate_monthly', 'true', 'boolean', 'reports', 'Aylık raporlar otomatik oluşturulsun mu?')
ON CONFLICT (key) DO NOTHING;
