import { z } from 'zod';

/**
 * User Role Enum
 */
export const userRoleSchema = z.enum(['admin', 'lab', 'production', 'warehouse']);

/**
 * Create User Validation Schema
 */
export const createUserSchema = z.object({
    email: z
        .string()
        .min(1, 'Email zorunludur')
        .email('Geçerli bir email adresi giriniz'),
    name: z
        .string()
        .min(2, 'İsim en az 2 karakter olmalıdır')
        .max(255, 'İsim en fazla 255 karakter olabilir'),
    role: userRoleSchema,
    phone: z
        .string()
        .regex(/^\+?[0-9\s-()]+$/, 'Geçerli bir telefon numarası giriniz')
        .optional()
        .or(z.literal('')),
    password: z
        .string()
        .min(8, 'Şifre en az 8 karakter olmalıdır')
        .max(100, 'Şifre en fazla 100 karakter olabilir'),
    is_active: z.boolean().default(true),
});

/**
 * Update User Validation Schema
 */
export const updateUserSchema = createUserSchema.partial().extend({
    id: z.string().uuid(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
