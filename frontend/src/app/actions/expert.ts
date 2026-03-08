"use server";

import { getCurrentUser } from "./auth";
import { getSettingByKey } from "./settings";
import { createClient } from "../../lib/supabase/server";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

const KNOWLEDGE_BASE = {
  persona:
    "Sen, kimya endüstrisinde uzun yıllara dayanan deneyime sahip kıdemli bir üretim ve kalite kontrol uzmanısın. Özellikle tekstil kimyasalları, boyama süreçleri ve ISO standartları konusunda derinlemesine bilgiye sahipsin. Yanıtların her zaman teknik, kesin ve endüstri standartlarına uygun olmalı. Güvenlik uyarılarını her zaman en başta belirt.",
  chemicals:
    "Kullanılan temel kimyasallar: Sodyum Hidroksit (Kostik), Hidrojen Peroksit, Asetik Asit, Sodyum Karbonat, Dispers Boyar Maddeler, Reaktif Boyar Maddeler. Her birinin MSDS (Malzeme Güvenlik Bilgi Formu) verilerine hakimsin.",
  iso_standards:
    "Önemli Standartlar:\n- ISO 9001: Kalite Yönetim Sistemleri\n- ISO 14001: Çevre Yönetim Sistemleri\n- ISO 45001: İş Sağlığı ve Güvenliği\n- Oeko-Tex Standard 100: Tekstil ürünlerinde zararlı maddelerin sınırlandırılması.",
  production:
    "Üretim Süreçleri: 1. Hammadde Kontrolü 2. Reçete Hazırlama 3. Dozajlama 4. Reaksiyon/Karışım 5. Kalite Kontrol (pH, Viskozite, Renk) 6. Dolum ve Paketleme.",
};

export async function askExpert(
  prompt: string,
  history: { role: string; parts: { text: string }[] }[] = [],
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "lab")) {
      throw new Error(
        "Yetkisiz erişim. Bu modül sadece Admin ve Lab kullanıcıları içindir.",
      );
    }

    // Get OpenRouter API Key and Model from DB settings
    const { data: apiKey } = await getSettingByKey("OPENROUTER_API_KEY");
    const { data: modelSetting } = await getSettingByKey("OPENROUTER_MODEL");
    const activeModel = modelSetting || DEFAULT_MODEL;

    if (!apiKey) {
      throw new Error(
        'OpenRouter API anahtarı ayarlanmamış. Lütfen Admin panelinden "Ayarlar" sekmesine giderek anahtarı giriniz.',
      );
    }

    // Search for relevant data (Hybrid RAG: Chemicals + Intelligence)
    let chemicalContext = "";
    let intelligenceContext = "";

    const supabase = await createClient();
    const searchTerm = prompt
      .slice(0, 50)
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim();

    try {
      if (searchTerm.length >= 2) {
        // 1. Search in Chemical Products (SQL ilike)
        const { data: searchResults } = await supabase
          .from("chemical_products")
          .select(
            "product_name, manufacturer, category, general_function, type",
          )
          .or(
            `product_name.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%`,
          )
          .limit(5);

        if (searchResults && searchResults.length > 0) {
          chemicalContext =
            "\n\nVERİTABANINDAN BULUNAN İLGİLİ KİMYASAL ÜRÜNLER:\n" +
            searchResults
              .map(
                (r) =>
                  `- Ürün: ${r.product_name}\n  Üretici: ${r.manufacturer || "Belirtilmemiş"}\n  Kategori: ${r.category || "-"}\n  Fonksiyon: ${r.general_function || "-"}\n  Tip: ${r.type || "-"}`,
              )
              .join("\n\n");
        }

        // 2. Search in Intelligence Data (Simple keyword search for now, vector search requires embedding generation)
        // Note: Real vector search would happen here if we had an embedding function available in server actions
        const { data: intelligenceResults } = await supabase
          .from("kts_intelligence_data")
          .select("title, content, url")
          .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
          .limit(3);

        if (intelligenceResults && intelligenceResults.length > 0) {
          intelligenceContext =
            "\n\nCANLI İSTİHBARAT VE DIŞ KAYNAKLARDAN BİLGİLER:\n" +
            intelligenceResults
              .map(
                (r) =>
                  `- Başlık: ${r.title}\n  İçerik Özeti: ${r.content.substring(0, 300)}...\n  Kaynak: ${r.url}`,
              )
              .join("\n\n");
        }
      }
    } catch (searchError) {
      console.error("Data search error:", searchError);
    }

    // Build system instruction
    const systemInstruction = `${KNOWLEDGE_BASE.persona}\n\nKullanabileceğin teknik bilgi havuzu:\n${KNOWLEDGE_BASE.chemicals}\n\n${KNOWLEDGE_BASE.iso_standards}\n\n${KNOWLEDGE_BASE.production}${chemicalContext}${intelligenceContext}\n\nYanıtlarını bu teknik verilere dayandır ve her zaman profesyonel teknik format kullan.`;

    // Convert history from Gemini format to OpenAI/OpenRouter format
    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemInstruction },
    ];

    for (const msg of history) {
      messages.push({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.parts.map((p) => p.text).join("\n"),
      });
    }

    // Add current prompt
    messages.push({ role: "user", content: prompt });

    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_SUPABASE_URL ||
          "https://kimyasaltakip.netlify.app",
        "X-Title": "Kimyasal Takip Sistemi",
      },
      body: JSON.stringify({
        model: activeModel,
        messages,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API hatası (${response.status}): ${errorData?.error?.message || response.statusText}`,
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    return { text, error: null };
  } catch (error: any) {
    console.error("OpenRouter API Hatası:", error);
    return { text: "", error: error.message || "Bir hata oluştu." };
  }
}
