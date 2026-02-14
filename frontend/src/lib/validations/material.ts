import { z } from 'zod';

/**
 * Material Category Enum
 */
export const materialCategorySchema = z.enum([
    'Boyar Madde',
    'Kimyasal',
    'Yardımcı Madde',
    'Tuz/Alkali',
    'Asit',
    'Diğer',
]);

/**
 * Material Unit Enum
 */
export const materialUnitSchema = z.enum([
    'kg',
    'lt',
    'gr',
    'ml',
    'adet',
]);

/**
 * Create Material Validation Schema
 */
export const createMaterialSchema = z.object({
    code: z
        .string()
        .min(1, 'Malzeme kodu zorunludur')
        .max(50, 'Malzeme kodu en fazla 50 karakter olabilir')
        .regex(/^[A-Za-z0-9\-_]+$/, 'Malzeme kodu sadece harf, rakam, tire ve alt çizgi içerebilir'),
    name: z
        .string()
        .min(2, 'Malzeme adı en az 2 karakter olmalıdır')
        .max(255, 'Malzeme adı en fazla 255 karakter olabilir'),
    description: z
        .string()
        .max(1000, 'Açıklama en fazla 1000 karakter olabilir')
        .optional()
        .or(z.literal('')),
    unit: materialUnitSchema,
    category: materialCategorySchema.optional().or(z.literal('')),
    critical_level: z
        .number({ invalid_type_error: 'Kritik seviye bir sayı olmalıdır' })
        .min(0, 'Kritik seviye negatif olamaz')
        .max(999999, 'Kritik seviye çok yüksek')
        .default(0),
    supplier_info: z
        .string()
        .max(500, 'Tedarikçi bilgisi en fazla 500 karakter olabilir')
        .optional()
        .or(z.literal('')),
    safety_info: z
        .string()
        .max(1000, 'Güvenlik bilgisi en fazla 1000 karakter olabilir')
        .optional()
        .or(z.literal('')),
    is_active: z.boolean().default(true),
});

/**
 * Update Material Validation Schema
 */
export const updateMaterialSchema = createMaterialSchema.partial().extend({
    id: z.string().uuid('Geçersiz malzeme ID formatı'),
});

/**
 * Helper: Parse FormData into validated material object
 */
export function parseMaterialFormData(formData: FormData) {
    return createMaterialSchema.safeParse({
        code: formData.get('code'),
        name: formData.get('name'),
        description: formData.get('description') || '',
        unit: formData.get('unit'),
        category: formData.get('category') || '',
        critical_level: parseFloat(formData.get('critical_level') as string) || 0,
        supplier_info: formData.get('supplier_info') || '',
        safety_info: formData.get('safety_info') || '',
        is_active: formData.get('is_active') === 'true',
    });
}

export type CreateMaterialFormData = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialFormData = z.infer<typeof updateMaterialSchema>;
