'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCurrentUser } from './auth';
import { getSettingByKey } from './settings';
import { createClient } from '@/lib/supabase/server';

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

        // Search for relevant chemical data
        let contextData = "";
        try {
            const searchTerm = prompt.slice(0, 50).replace(/[^a-zA-Z0-9\s-]/g, '').trim();
            if (searchTerm.length >= 2) {
                const supabase = await createClient();
                const { data: searchResults } = await supabase
                    .from('chemical_products')
                    .select('product_name, manufacturer, category, general_function, type')
                    .or(`product_name.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%`)
                    .limit(5);

                if (searchResults && searchResults.length > 0) {
                    contextData = "\n\nVERİTABANINDAN BULUNAN İLGİLİ KİMYASAL ÜRÜNLER:\n" + searchResults.map(r =>
                        `- Ürün: ${r.product_name}\n  Üretici: ${r.manufacturer || 'Belirtilmemiş'}\n  Kategori: ${r.category || '-'}\n  Fonksiyon: ${r.general_function || '-'}\n  Tip: ${r.type || '-'}`
                    ).join("\n\n");
                }
            }
        } catch (searchError) {
            console.error('Chemical search error:', searchError);
            // Continue without context data if search fails
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-3-flash-preview',
            systemInstruction: `${KNOWLEDGE_BASE.persona}\n\nKullanabileceğin teknik bilgi havuzu:\n${KNOWLEDGE_BASE.chemicals}\n\n${KNOWLEDGE_BASE.iso_standards}\n\n${KNOWLEDGE_BASE.production}${contextData}\n\nYanıtlarını bu teknik verilere dayandır ve her zaman profesyonel teknik format kullan.`
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
