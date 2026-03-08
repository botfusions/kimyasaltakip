"use server";

import { createClient } from "../../lib/supabase/server";
import { getCurrentUser } from "./auth";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function getOpenRouterKey() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kts_settings")
    .select("value")
    .eq("key", "OPENROUTER_API_KEY")
    .single();
  return data?.value;
}

// Basit bir embedding oluşturucu (All-MiniLM-L6-v2 benzeri bir API kullanıldığında burası güncellenir)
// Şimdilik test için boş vektör veya Supabase tarafında üretilen bir araç kullanılabilir.
// NOT: Gerçek implementasyonda istemci tarafında veya bir edge function ile embedding üretilmelidir.
async function generateEmbedding(text: string): Promise<number[]> {
  // Şimdilik 384 boyutlu boş bir vektör dönelim. 
  // Gerçek kullanımda burada bir embedding modelleri (Huggingface vb.) çağrılmalıdır.
  return new Array(384).fill(0);
}

export async function sendChatMessage(message: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Oturum açmanız gerekiyor.");

    const apiKey = await getOpenRouterKey();
    if (!apiKey) throw new Error("OpenRouter API anahtarı yapılandırılmamış.");

    const supabase = await createClient();

    // 1. Kullanıcı mesajı için embedding oluştur (ŞİMDİLİK BOŞ, RPC ile direkt içerikten arama yapılabilirse o tercih edilmeli)
    // Gerçek dünyada kts_intelligence_data içeriğinden metin bazlı arama da yapılabilir.
    // Şimdilik RAG verilerini metin olarak çekiyoruz (Sadece RAG kısıtlaması için).
    const { data: ragContext, error: ragError } = await supabase
      .from("kts_intelligence_data")
      .select("content, title")
      .limit(5);

    if (ragError) throw ragError;

    const contextText = ragContext
      .map((d) => `### ${d.title}\n${d.content}`)
      .join("\n\n");

    const systemPrompt = `Sen Kimyasal Takip Sistemi'nin AI Uzman Botu'sun. 
Kullanıcılara sadece aşağıdaki BİLGİ BANKASI verilerine dayanarak cevap vermelisin. 

BİLGİ BANKASI VERİLERİ:
${contextText}

KURALLAR:
1. Sadece yukarıdaki verilere göre cevap ver.
2. Eğer sorunun cevabı yukarıdaki dökümanlarda yoksa, "Özür dilerim, bu konu hakkında bilgi bankamda veri bulunmuyor. Sadece eklenen teknik dökümanlar ve standartlar hakkında bilgi verebilirim." şeklinde cevap ver.
3. Dış dünyadan genel bilgi (yemek tarifi, genel tarih vb.) kesinlikle verme.
4. Cevapların teknik ve yardımcı olsun.
5. Kullanıcının sorduğu formül veya standartlar dökümanda varsa detaylandır.`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kimyasaltakip.netlify.app",
        "X-Title": "Kimyasal Takip RAG Bot",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001", // Hızlı ve etkili
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.1, // Daha kesin cevaplar için düşük temperature
      }),
    });

    const data = await response.json();
    return { 
      reply: data.choices[0].message.content,
      error: null 
    };

  } catch (error: any) {
    console.error("Chat Error:", error);
    return { reply: null, error: error.message };
  }
}
