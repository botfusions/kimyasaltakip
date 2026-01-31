'use server';

import { generateMonthlyUsageCSV } from '@/lib/reports';
import { sendEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

/**
 * Server action to manually trigger and send a monthly usage report.
 */
export async function sendMonthlyReportAction() {
    try {
        const supabase = await createClient();

        // 1. Get receiver emails from settings
        const { data: setting } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'REPORT_RECEIVER_EMAILS')
            .single();

        const receivers = setting?.value || 'admin@example.com';

        // 2. Generate CSV
        const report = await generateMonthlyUsageCSV();
        if (!report.success || !report.csv) {
            throw new Error('CSV üretilemedi: ' + report.error);
        }

        // 3. Send Email with attachment
        const result = await sendEmail({
            to: receivers.split(','),
            subject: 'Aylık Kimyasal Tüketim ve İzlenebilirlik Raporu',
            text: 'Merhaba, ekte aylık kimyasal tüketim raporunu bulabilirsiniz.',
            attachments: [
                {
                    filename: `kullanim_raporu_${new Date().toISOString().slice(0, 10)}.csv`,
                    content: Buffer.from(report.csv).toString('base64'),
                },
            ],
        });

        return result;
    } catch (error: any) {
        console.error('Manual report action error:', error);
        return { success: false, error: error.message };
    }
}
