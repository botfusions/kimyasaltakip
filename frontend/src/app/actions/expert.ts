'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCurrentUser } from './auth';
import { getSettingByKey } from './settings';

const KNOWLEDGE_BASE = {
    persona: "Sen, kimya endüstrisinde uzun yıllara dayanan deneyime sahip kıdemli bir üretim ve kalite kontrol uzmanısın. Özellikle tekstil kimyasalları, boyama süreçleri ve ISO standartları konusunda derinlemesine bilgiye sahipsin. Yanıtların her zaman teknik, kesin ve endüstri standartlarına uygun olmalı. Güvenlik uyarılarını her zaman en başta belirt.",
    chemicals: "Kullanılan temel kimyasallar: Sodyum Hidroksit (Kostik), Hidrojen Peroksit, Asetik Asit, Sodyum Karbonat, Dispers Boyar Maddeler, Reaktif Boyar Maddeler. Her birinin MSDS (Malzeme Güvenlik Bilgi Formu) verilerine hakimsin.",
    iso_standards: "Önemli Standartlar:\n- ISO 9001: Kalite Yönetim Sistemleri\n- ISO 14001: Çevre Yönetim Sistemleri\n- ISO 45001: İş Sağlığı ve Güvenliği\n- Oeko-Tex Standard 100: Tekstil ürünlerinde zararlı maddelerin sınırlandırılması.",
    production: "Üretim Süreçleri: 1. Hammadde Kontrolü 2. Reçete Hazırlama 3. Dozajlama 4. Reaksiyon/Karışım 5. Kalite Kontrol (pH, Viskozite, Renk) 6. Dolum ve Paketleme."
};

export async function askExpert(prompt: string, history: { role: string; parts: { text: string }[] }[] = []) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== 'admin' && user.role !== 'lab')) {
            throw new Error('Yetkisiz erişim. Bu modül sadece Admin ve Lab kullanıcıları içindir.');
        }

        // Get API Key from DB settings
        const { data: apiKey } = await getSettingByKey('GOOGLE_GENERATIVE_AI_API_KEY');

        if (!apiKey) {
            throw new Error('Gemini API anahtarı ayarlanmamış. Lütfen Admin panelinden "Ayarlar" sekmesine giderek anahtarı giriniz.');
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({
            model: 'gemini-3-flash-preview',
            systemInstruction: `${KNOWLEDGE_BASE.persona}\n\nKullanabileceğin teknik bilgi havuzu:\n${KNOWLEDGE_BASE.chemicals}\n\n${KNOWLEDGE_BASE.iso_standards}\n\n${KNOWLEDGE_BASE.production}\n\nYanıtlarını bu teknik verilere dayandır ve her zaman profesyonel teknik format kullan.`
        });

        const chat = model.startChat({
            history: history.length > 0 ? history : [],
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.7,
            },
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        return { text: response.text(), error: null };
    } catch (error: any) {
        console.error('Gemini API Hatası:', error);
        return { text: '', error: error.message || 'Bir hata oluştu.' };
    }
}
