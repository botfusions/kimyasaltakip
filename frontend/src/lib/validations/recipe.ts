import { z } from "zod";

/**
 * Recipe Status Enum
 */
export const recipeStatusSchema = z.enum([
  "draft",
  "pending",
  "approved",
  "rejected",
  "in_production",
  "completed",
]);

/**
 * Recipe Item Validation Schema
 */
export const recipeItemSchema = z.object({
  material_id: z.string().uuid("Geçersiz malzeme ID formatı"),
  quantity: z
    .number({ invalid_type_error: "Miktar bir sayı olmalıdır" })
    .positive("Miktar sıfırdan büyük olmalıdır")
    .max(999999, "Miktar çok yüksek"),
  unit: z
    .string()
    .min(1, "Birim zorunludur")
    .max(10, "Birim en fazla 10 karakter olabilir"),
  percentage: z
    .number()
    .min(0, "Yüzde negatif olamaz")
    .max(100, "Yüzde 100'den büyük olamaz")
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(500, "Not en fazla 500 karakter olabilir")
    .optional()
    .or(z.literal("")),
});

/**
 * Create Recipe Validation Schema
 */
export const createRecipeSchema = z.object({
  product_id: z
    .string()
    .uuid("Geçersiz ürün ID formatı")
    .min(1, "Ürün seçimi zorunludur"),
  usage_type_id: z
    .string()
    .uuid("Geçersiz kullanım tipi ID formatı")
    .optional()
    .or(z.literal("")),
  name: z
    .string()
    .min(2, "Reçete adı en az 2 karakter olmalıdır")
    .max(255, "Reçete adı en fazla 255 karakter olabilir")
    .optional()
    .or(z.literal("")),
  order_code: z
    .string()
    .max(100, "Sipariş kodu en fazla 100 karakter olabilir")
    .optional()
    .or(z.literal("")),
  color_name: z
    .string()
    .max(100, "Renk adı en fazla 100 karakter olabilir")
    .optional()
    .or(z.literal("")),
  customer_name: z
    .string()
    .max(255, "Müşteri adı en fazla 255 karakter olabilir")
    .optional()
    .or(z.literal("")),
  process_info: z
    .string()
    .max(500, "Proses bilgisi en fazla 500 karakter olabilir")
    .optional()
    .or(z.literal("")),
  total_weight: z
    .number({ invalid_type_error: "Toplam ağırlık bir sayı olmalıdır" })
    .min(0, "Toplam ağırlık negatif olamaz")
    .optional()
    .nullable(),
  bath_volume: z
    .number({ invalid_type_error: "Banyo hacmi bir sayı olmalıdır" })
    .min(0, "Banyo hacmi negatif olamaz")
    .optional()
    .nullable(),
  machine_code: z
    .string()
    .max(100, "Makine kodu en fazla 100 karakter olabilir")
    .optional()
    .or(z.literal("")),
  yarn_type: z
    .string()
    .max(100, "İplik tipi en fazla 100 karakter olabilir")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(2000, "Notlar en fazla 2000 karakter olabilir")
    .optional()
    .or(z.literal("")),
  items: z.array(recipeItemSchema).optional(),
});

/**
 * Update Recipe Validation Schema
 */
export const updateRecipeSchema = createRecipeSchema.partial().extend({
  id: z.string().uuid("Geçersiz reçete ID formatı"),
});

/**
 * Submit for Approval Schema
 */
export const submitForApprovalSchema = z.object({
  recipeId: z.string().uuid("Geçersiz reçete ID formatı"),
  complianceReport: z.string().min(1, "Uyumluluk raporu zorunludur"),
});

/**
 * Approve Recipe Schema
 */
export const approveRecipeSchema = z.object({
  recipeId: z.string().uuid("Geçersiz reçete ID formatı"),
  signatureId: z.string().min(1, "İmza ID zorunludur"),
});

/**
 * Reject Recipe Schema
 */
export const rejectRecipeSchema = z.object({
  recipeId: z.string().uuid("Geçersiz reçete ID formatı"),
  reason: z
    .string()
    .min(5, "Red gerekçesi en az 5 karakter olmalıdır")
    .max(1000, "Red gerekçesi en fazla 1000 karakter olabilir"),
});

export type CreateRecipeFormData = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeFormData = z.infer<typeof updateRecipeSchema>;
export type RecipeItemFormData = z.infer<typeof recipeItemSchema>;
export type RecipeStatus = z.infer<typeof recipeStatusSchema>;
