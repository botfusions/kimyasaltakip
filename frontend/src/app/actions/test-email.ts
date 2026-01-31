'use server';

import { sendEmail } from '@/lib/email';

/**
 * Test email gönderimi (Sadece test amaçlı)
 */
export async function sendTestEmail() {
    try {
        const result = await sendEmail({
            to: 'cenk.tokgoz@gmail.com',
            subject: 'Kimyasal Takip Sistemi - Test Email',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2563eb;">🧪 Kimyasal Takip Sistemi</h1>
                    <p>Merhaba,</p>
                    <p>Email sisteminiz başarıyla yapılandırıldı ve çalışıyor!</p>
                    <p>Bu bir test emailidir. Sisteminizden gönderilen bildirimleri bundan sonra alabileceksiniz.</p>
                    <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 14px;">
                        <strong>Özellikler:</strong><br>
                        ✅ Reçete onay bildirimleri<br>
                        ✅ Aylık kullanım raporları<br>
                        ✅ Kritik stok uyarıları
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
                        Bu email otomatik olarak gönderilmiştir.
                    </p>
                </div>
            `,
            text: 'Kimyasal Takip Sistemi test emaili. Email sisteminiz başarıyla çalışıyor!',
        });

        if (result.success) {
            return {
                success: true,
                message: 'Test email başarıyla gönderildi! Lütfen gelen kutunuzu kontrol edin.'
            };
        } else {
            return {
                success: false,
                message: `Email gönderilemedi: ${result.error}`
            };
        }
    } catch (error: any) {
        console.error('Test email hatası:', error);
        return {
            success: false,
            message: `Hata: ${error.message}`
        };
    }
}
