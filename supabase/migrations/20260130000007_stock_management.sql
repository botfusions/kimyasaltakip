-- Gerçek Zamanlı Stok Yönetimi Fonksiyonları ve Tetikleyiciler

-- 1. Üretim tamamlandığında stoktan düşen fonksiyon
CREATE OR REPLACE FUNCTION public.handle_production_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Sadece durum 'completed' olduğunda ve eskisi 'completed' değilse çalış
    IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
        
        -- Her bir üretim malzemesi için stok düşümü yap
        -- production_materials tablosu production_log_id ile bağlıdır
        
        -- Malzeme miktarını düş
        UPDATE materials m
        SET 
            stock_quantity = m.stock_quantity - pm.actual_quantity,
            updated_at = NOW()
        FROM production_materials pm
        WHERE pm.production_log_id = NEW.id
        AND pm.material_id = m.id;

        -- Stok hareketleri tablosuna (stock_movements) kayıt ekle
        INSERT INTO stock_movements (
            material_id,
            type,
            quantity,
            reason,
            reference_id,
            created_at
        )
        SELECT 
            pm.material_id,
            'out',
            pm.actual_quantity,
            'Üretim Tüketimi (Parti No: ' || NEW.batch_number || ')',
            NEW.id,
            NOW()
        FROM production_materials pm
        WHERE pm.production_log_id = NEW.id;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Tetikleyiciyi oluştur
DROP TRIGGER IF EXISTS trg_handle_production_completion ON public.production_logs;
CREATE TRIGGER trg_handle_production_completion
    AFTER UPDATE ON public.production_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_production_completion();

-- 3. Kritik Stok Görünümü (Dashboard için)
CREATE OR REPLACE VIEW public.view_critical_stock AS
SELECT 
    id,
    code,
    name,
    stock_quantity,
    min_stock_level,
    unit
FROM materials
WHERE stock_quantity <= min_stock_level;
