import { Resend } from 'resend';

// Email ayarları (SQL'den aldığımız değerler)
const RESEND_API_KEY = 're_imv7Zsfa_7tD72N9B2g98B2ypdwUzmwNC';
const EMAIL_FROM = 'onboarding@resend.dev';
const EMAIL_TO = 'cenk.tokgoz@gmail.com';

async function testEmail() {
    console.log('📧 Email testi başlatılıyor...\n');

    try {
        const resend = new Resend(RESEND_API_KEY);

        console.log('🔑 API Key:', RESEND_API_KEY.substring(0, 10) + '...');
        console.log('📤 Gönderici:', EMAIL_FROM);
        console.log('📥 Alıcı:', EMAIL_TO);
        console.log('\n✉️  Email gönderiliyor...\n');

        const { data, error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: EMAIL_TO,
            subject: 'Kimyasal Takip Sistemi - Test Email ✅',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px;">
                        🧪 Kimyasal Takip Sistemi
                    </h1>
                    <p style="font-size: 16px; line-height: 1.6;">Merhaba,</p>
                    <p style="font-size: 16px; line-height: 1.6;">
                        Email sisteminiz başarıyla yapılandırıldı ve çalışıyor! 🎉
                    </p>
                    <p style="font-size: 16px; line-height: 1.6;">
                        Bu bir test emailidir. Sisteminizden gönderilen bildirimleri bundan sonra alabileceksiniz.
                    </p>
                    <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
                        <p style="margin: 0; font-weight: bold; color: #1f2937;">📋 Özellikler:</p>
                        <ul style="color: #4b5563; line-height: 1.8;">
                            <li>✅ Reçete onay bildirimleri</li>
                            <li>✅ Aylık kullanım raporları</li>
                            <li>✅ Kritik stok uyarıları</li>
                        </ul>
                    </div>
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
                        Bu email otomatik olarak gönderilmiştir.
                        <br>Kimyasal Takip Sistemi © 2026
                    </p>
                </div>
            `,
            text: 'Kimyasal Takip Sistemi test emaili. Email sisteminiz başarıyla çalışıyor!',
        });

        if (error) {
            console.error('❌ Email gönderme hatası:', error);
            process.exit(1);
        }

        console.log('✅ Email başarıyla gönderildi!\n');
        console.log('📊 Resend Response:');
        console.log(JSON.stringify(data, null, 2));
        console.log('\n🎯 Lütfen ' + EMAIL_TO + ' adresindeki gelen kutunuzu kontrol edin!');

    } catch (error) {
        console.error('❌ Fatal hata:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testEmail();
