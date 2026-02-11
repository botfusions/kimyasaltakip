-- Generated SQL for Invoice Import
-- Run this in Supabase SQL Editor


-- Material: 33905C
INSERT INTO materials (code, name, unit, category, is_active, critical_level)
VALUES ('33905C', 'RUCO-FLOW BBA', 'kg', 'Kimyasal', true, 100)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;


-- Material: 0258
INSERT INTO materials (code, name, unit, category, is_active, critical_level)
VALUES ('0258', '371', 'kg', 'Kimyasal', true, 100)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;


-- Stock Movement for 0258
INSERT INTO stock_movements (
    material_id, 
    movement_type, 
    quantity, 
    supplier, 
    created_by,
    notes
)
VALUES (
    (SELECT id FROM materials WHERE code = '0258' LIMIT 1), 
    'in', 
    34, 
    'Bilinmeyen Tedarikçi', 
    (SELECT id FROM users ORDER BY created_at ASC LIMIT 1), 
    'Fatura: OCR-INV-1770829994709'
);
