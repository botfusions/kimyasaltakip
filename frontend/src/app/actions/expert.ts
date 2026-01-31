'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCurrentUser } from './auth';
import { getSettingByKey } from './settings';

// Archive data (Hardcoded for simplicity and speed in this specific module context)
// ... (rest of KNOWLEDGE_BASE remains same)

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
            model: 'gemini-1.5-flash',
            systemInstruction: `${KNOWLEDGE_BASE.persona}\n\nKullanabileceğin teknik bilgi havuzu:\n${KNOWLEDGE_BASE.chemicals}\n\n${KNOWLEDGE_BASE.iso_standards}\n\n${KNOWLEDGE_BASE.production}\n\nYanıtlarını bu teknik verilere dayandır ve her zaman profesyonel teknik format kullan.`
        });
        // ... rest of function

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
