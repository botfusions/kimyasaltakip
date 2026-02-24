import { Resend } from 'resend';
import { createClient } from './supabase/server';

/**
 * Sends an email using Resend, fetching configuration from the settings table.
 */
export async function sendEmail(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: any[];
}) {
    try {
        const supabase = await createClient();

        // Fetch settings
        const { data: settings, error: settingsError } = await supabase
            .from('kts_settings')
            .select('key, value')
            .in('key', ['RESEND_API_KEY', 'EMAIL_FROM_ADDRESS']);

        if (settingsError) throw settingsError;

        const config = settings.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        const apiKey = config['RESEND_API_KEY'];
        const fromAddress = config['EMAIL_FROM_ADDRESS'];

        if (!apiKey) {
            console.error('RESEND_API_KEY is not configured in settings table');
            return { success: false, error: 'API key missing' };
        }

        const resend = new Resend(apiKey);

        const { data, error } = await resend.emails.send({
            from: fromAddress || 'noreply@yourdomain.com',
            to: options.to,
            subject: options.subject,
            text: options.text || '',
            html: options.html,
            attachments: options.attachments,
        });

        if (error) {
            console.error('Resend email error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error('Fatal error in sendEmail:', error);
        return { success: false, error: error.message };
    }
}
