import { z } from 'zod';

/**
 * Create Product Validation Schema
 */
export const createProductSchema = z.object({
    code: z
        .string()
        .min(1, 'Ürün kodu zorunludur')
        .max(50, 'Ürün kodu en fazla 50 karakter olabilir')
        .regex(/^[A-Za-z0-9\-_/]+$/, 'Ürün kodu sadece harf, rakam, tire, alt çizgi ve eğik çizgi içerebilir'),
    name: z
        .string()
        .min(2, 'Ürün adı en az 2 karakter olmalıdır')
        .max(255, 'Ürün adı en fazla 255 karakter olabilir'),
    description: z
        .string()
        .max(1000, 'Açıklama en fazla 1000 karakter olabilir')
        .optional()
        .or(z.literal('')),
    base_color: z
        .string()
        .max(100, 'Renk bilgisi en fazla 100 karakter olabilir')
        .optional()
        .or(z.literal('')),
    is_active: z.boolean().default(true),
});

/**
 * Update Product Validation Schema
 */
export const updateProductSchema = createProductSchema.partial().extend({
    id: z.string().uuid('Geçersiz ürün ID formatı'),
});

/**
 * Helper: Parse FormData into validated product object
 */
export function parseProductFormData(formData: FormData) {
    return createProductSchema.safeParse({
        code: formData.get('code'),
        name: formData.get('name'),
        description: formData.get('description') || '',
        base_color: formData.get('base_color') || '',
        is_active: formData.get('is_active') === 'true',
    });
}

export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;
