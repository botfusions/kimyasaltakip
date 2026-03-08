/**
 * Centralized Validation Schemas - Barrel Export
 *
 * All Zod validation schemas are exported from here for easy import.
 * Usage: import { createMaterialSchema, parseProductFormData } from './lib/validations';
 */

export * from "./auth";
export * from "./user";
export * from "./material";
export * from "./product";
export * from "./stock";
export * from "./recipe";

/**
 * Common validation helpers
 */
import { z } from "zod";

/** UUID validator */
export const uuidSchema = z.string().uuid("Geçersiz ID formatı");

/** Pagination schema */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * Format Zod errors into a user-friendly string
 */
export function formatZodErrors(error: z.ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
      return `${path}${err.message}`;
    })
    .join(", ");
}

/**
 * Safe parse helper with formatted error response
 */
export function safeValidate<T extends z.ZodType>(
  schema: T,
  data: unknown,
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: formatZodErrors(result.error) };
}
