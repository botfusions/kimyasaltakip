import { z } from 'zod';

/**
 * Login Form Validation Schema
 */
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email zorunludur')
        .email('Geçerli bir email adresi giriniz'),
    password: z
        .string()
        .min(6, 'Şifre en az 6 karakter olmalıdır'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
