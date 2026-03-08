import { z } from "zod";

/**
 * Stock Movement Type Enum
 */
export const movementTypeSchema = z.enum(["in", "out", "adjustment"], {
  errorMap: () => ({
    message: "Geçerli bir hareket tipi seçiniz (in, out, adjustment)",
  }),
});

/**
 * Stock Movement Validation Schema
 */
export const stockMovementSchema = z.object({
  material_id: z
    .string()
    .uuid("Geçersiz malzeme ID formatı")
    .min(1, "Malzeme seçimi zorunludur"),
  movement_type: movementTypeSchema,
  quantity: z
    .number({ invalid_type_error: "Miktar bir sayı olmalıdır" })
    .positive("Miktar sıfırdan büyük olmalıdır")
    .max(999999, "Miktar çok yüksek"),
  unit_cost: z
    .number({ invalid_type_error: "Birim maliyet bir sayı olmalıdır" })
    .min(0, "Birim maliyet negatif olamaz")
    .max(999999, "Birim maliyet çok yüksek")
    .optional()
    .nullable(),
  batch_number: z
    .string()
    .max(100, "Parti numarası en fazla 100 karakter olabilir")
    .optional()
    .or(z.literal("")),
  supplier: z
    .string()
    .max(255, "Tedarikçi bilgisi en fazla 255 karakter olabilir")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(1000, "Notlar en fazla 1000 karakter olabilir")
    .optional()
    .or(z.literal("")),
});

/**
 * Helper: Parse FormData into validated stock movement object
 */
export function parseStockMovementFormData(formData: FormData) {
  const unitCostRaw = formData.get("unit_cost");
  const unitCost = unitCostRaw ? parseFloat(unitCostRaw as string) : null;

  return stockMovementSchema.safeParse({
    material_id: formData.get("material_id"),
    movement_type: formData.get("movement_type"),
    quantity: parseFloat(formData.get("quantity") as string),
    unit_cost: isNaN(unitCost as number) ? null : unitCost,
    batch_number: formData.get("batch_number") || "",
    supplier: formData.get("supplier") || "",
    notes: formData.get("notes") || "",
  });
}

export type StockMovementFormData = z.infer<typeof stockMovementSchema>;
