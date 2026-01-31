'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validations/auth';

/**
 * Sign in with email and password
 */
export async function signIn(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validate input
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
        return {
            error: validation.error.errors[0].message,
        };
    }

    const supabase = await createClient();

    // Sign in with Supabase Auth
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
    });

    if (authError) {
        return {
            error: 'Email veya şifre hatalı',
        };
    }

    // Redirect to dashboard
    redirect('/dashboard');
}

/**
 * Sign out current user
 */
export async function signOut() {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        return {
            error: 'Çıkış yapılırken bir hata oluştu',
        };
    }

    revalidatePath('/', 'layout');
    redirect('/login');
}

/**
 * Get current authenticated user with profile data
 */
export async function getCurrentUser() {
    const supabase = await createClient();

    // Get auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return null;
    }

    // Get user profile from users table
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, role, is_active, phone, last_login_at')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        return null;
    }

    // Update last login time
    await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);

    return profile;
}

/**
 * Get current session
 */
export async function getSession() {
    const supabase = await createClient();

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        return null;
    }

    return session;
}
