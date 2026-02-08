-- Create view for critical stock levels
-- This view helps identify materials that are below their critical level

CREATE OR REPLACE VIEW public.view_critical_stock AS
SELECT
    s.id as stock_id,
    m.id as material_id,
    m.code as material_code,
    m.name as material_name,
    m.unit,
    m.category,
    s.quantity as current_quantity,
    s.reserved_quantity,
    (s.quantity - s.reserved_quantity) as available_quantity,
    m.critical_level,
    (s.quantity - s.reserved_quantity) - m.critical_level as difference,
    CASE
        WHEN (s.quantity - s.reserved_quantity) <= 0 THEN 'out_of_stock'
        WHEN (s.quantity - s.reserved_quantity) <= m.critical_level * 0.5 THEN 'critical'
        WHEN (s.quantity - s.reserved_quantity) <= m.critical_level THEN 'low'
        ELSE 'ok'
    END as status,
    s.location,
    s.last_movement_at
FROM
    public.stock s
    INNER JOIN public.materials m ON s.material_id = m.id
WHERE
    m.is_active = true
    AND (s.quantity - s.reserved_quantity) <= m.critical_level
ORDER BY
    (s.quantity - s.reserved_quantity) - m.critical_level ASC,
    m.name ASC;

-- Add comment
COMMENT ON VIEW public.view_critical_stock IS 'View showing materials with stock levels at or below critical threshold';

-- Grant access to authenticated users
GRANT SELECT ON public.view_critical_stock TO authenticated;
