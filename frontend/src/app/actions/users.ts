'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createUserSchema, updateUserSchema } from '@/lib/validations/user';
import { getCurrentUser } from './auth';

/**
 * Check if current user is admin
 */
async function checkAdminAccess() {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Bu işlem için yetkiniz yok');
    }

    return currentUser;
}

/**
 * Generate random signature ID (4-6 digits)
 */
function generateSignatureId(): string {
    // Generate random 4-6 digit number
    const length = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6 digits
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

/**
 * Get all users (Admin only)
 */
export async function getUsers(filters?: {
    role?: string;
    is_active?: boolean;
    search?: string;
}) {
    await checkAdminAccess();

    const supabase = await createClient();

    let query = supabase
        .from('kts_users')
        .select('id, email, name, role, is_active, phone, signature_id, created_at, last_login_at')
        .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.role) {
        query = query.eq('role', filters.role);
    }

    if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
    }

    if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
        return {
            error: 'Kullanıcılar yüklenirken hata oluştu',
        };
    }

    return { data };
}

/**
 * Create new user (Admin only)
 */
export async function createUser(formData: FormData) {
    const currentUser = await checkAdminAccess();

    const rawData = {
        email: formData.get('email') as string,
        name: formData.get('name') as string,
        role: formData.get('role') as string,
        phone: formData.get('phone') as string || undefined,
        password: formData.get('password') as string,
        is_active: formData.get('is_active') === 'true',
    };

    // Validate input
    const validation = createUserSchema.safeParse(rawData);
    if (!validation.success) {
        return {
            error: validation.error.errors[0].message,
        };
    }

    const supabase = await createClient();

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
            data: {
                name: validation.data.name,
                role: validation.data.role,
            },
        },
    });

    if (authError) {
        // Handle specific auth errors
        if (authError.message.includes('already registered')) {
            return { error: 'Bu email adresi zaten kullanılıyor' };
        }
        return { error: `Kullanıcı kaydı oluşturulurken hata: ${authError.message}` };
    }

    if (!authData.user) {
        return { error: 'Kullanıcı kaydı oluşturulamadı' };
    }

    // Generate signature ID for lab users
    let signatureId: string | null = null;
    if (validation.data.role === 'lab') {
        let attempt = 0;
        const maxAttempts = 10;

        while (attempt < maxAttempts) {
            signatureId = generateSignatureId();

            // Check if signature ID already exists
            const { data: existing } = await supabase
                .from('kts_users')
                .select('id')
                .eq('signature_id', signatureId)
                .single();

            if (!existing) break; // Unique ID found
            attempt++;
        }

        if (attempt === maxAttempts) {
            return { error: 'İmza ID oluşturulamadı, lütfen tekrar deneyin' };
        }
    }

    // 2. Insert user profile into users table
    const { data, error } = await supabase
        .from('kts_users')
        .insert({
            id: authData.user.id, // Use Auth user ID
            email: validation.data.email,
            name: validation.data.name,
            role: validation.data.role,
            phone: validation.data.phone || null,
            is_active: validation.data.is_active,
            signature_id: signatureId,
            created_by: currentUser.id,
        })
        .select()
        .single();

    if (error) {
        // If user profile creation fails, we should ideally delete the auth user
        // but Supabase doesn't allow that from client SDK
        // Admin should manually clean up via Supabase dashboard if needed
        if (error.code === '23505') { // Unique violation
            return { error: 'Bu email adresi zaten kullanılıyor' };
        }
        return { error: 'Kullanıcı profili oluşturulurken hata oluştu' };
    }

    // Log audit
    await supabase.from('kts_audit_logs').insert({
        table_name: 'users',
        record_id: data.id,
        action: 'INSERT',
        user_id: currentUser.id,
        changes: { new: { ...validation.data, password: '[REDACTED]' } },
    });

    revalidatePath('/dashboard/users');

    return { success: true, data };
}

/**
 * Update user (Admin only)
 */
export async function updateUser(userId: string, formData: FormData) {
    const currentUser = await checkAdminAccess();

    const rawData = {
        id: userId,
        email: formData.get('email') as string,
        name: formData.get('name') as string,
        role: formData.get('role') as string,
        phone: formData.get('phone') as string || undefined,
        is_active: formData.get('is_active') === 'true',
    };

    // Validate input
    const validation = updateUserSchema.safeParse(rawData);
    if (!validation.success) {
        return {
            error: validation.error.errors[0].message,
        };
    }

    const supabase = await createClient();

    // Get old data for audit
    const { data: oldData } = await supabase
        .from('kts_users')
        .select('*')
        .eq('id', userId)
        .single();

    // If role is changing to/from 'lab', manage signature_id
    let signatureId = oldData?.signature_id;

    if (validation.data.role === 'lab' && oldData?.role !== 'lab') {
        // Role changing TO lab - generate new signature ID
        let attempt = 0;
        const maxAttempts = 10;

        while (attempt < maxAttempts) {
            signatureId = generateSignatureId();

            const { data: existing } = await supabase
                .from('kts_users')
                .select('id')
                .eq('signature_id', signatureId)
                .single();

            if (!existing) break;
            attempt++;
        }

        if (attempt === maxAttempts) {
            return { error: 'İmza ID oluşturulamadı, lütfen tekrar deneyin' };
        }
    } else if (validation.data.role !== 'lab' && oldData?.role === 'lab') {
        // Role changing FROM lab - remove signature ID
        signatureId = null;
    }

    // Update user
    const { data, error } = await supabase
        .from('kts_users')
        .update({
            email: validation.data.email,
            name: validation.data.name,
            role: validation.data.role,
            phone: validation.data.phone || null,
            is_active: validation.data.is_active,
            signature_id: signatureId,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            return { error: 'Bu email adresi zaten kullanılıyor' };
        }
        return { error: 'Kullanıcı güncellenirken hata oluştu' };
    }

    // Log audit
    await supabase.from('kts_audit_logs').insert({
        table_name: 'users',
        record_id: userId,
        action: 'UPDATE',
        user_id: currentUser.id,
        changes: { old: oldData, new: validation.data },
    });

    revalidatePath('/dashboard/users');

    return { success: true, data };
}

/**
 * Toggle user active status (Admin only)
 */
export async function toggleUserStatus(userId: string) {
    const currentUser = await checkAdminAccess();

    const supabase = await createClient();

    // Get current status
    const { data: user } = await supabase
        .from('kts_users')
        .select('is_active')
        .eq('id', userId)
        .single();

    if (!user) {
        return { error: 'Kullanıcı bulunamadı' };
    }

    const newStatus = !user.is_active;

    // Update status
    const { error } = await supabase
        .from('kts_users')
        .update({
            is_active: newStatus,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

    if (error) {
        return { error: 'Durum değiştirilirken hata oluştu' };
    }

    // Log audit
    await supabase.from('kts_audit_logs').insert({
        table_name: 'users',
        record_id: userId,
        action: 'UPDATE',
        user_id: currentUser.id,
        changes: {
            old: { is_active: user.is_active },
            new: { is_active: newStatus },
        },
    });

    revalidatePath('/dashboard/users');

    return { success: true };
}
