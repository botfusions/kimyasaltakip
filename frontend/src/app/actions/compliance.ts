'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCurrentUser } from './auth';
import { getSettingByKey } from './settings';
import { createClient } from '@/lib/supabase/server';

const SYSTEM_INSTRUCTION = `
You are a top-tier chemical compliance expert in the textile industry. 
Your task is to cross-reference a given list of recipe ingredients against provided manufacturing restricted substances lists (MRLS, OEKOTEX, etc.) documents (PDFs).

Rules:
1. **Analyze** the provided PDF document(s) thoroughly. These may include MRLS, OEKOTEX, or other restricted substance lists.
2. **Review** the list of ingredients provided in the prompt.
3. **Identify** if any ingredient in the recipe matches a restricted substance in ANY of the provided documents.
    - Match by **CAS Number** (most accurate).
    - Match by **Chemical Name** (fuzzy match if CAS is missing, but be careful of synonyms).
4. **Report** your findings in a strict JSON format.

JSON Output Format:
{
  "is_compliant": boolean, // true if NO restricted substances are found (or all are within limits), false otherwise.
  "analyzed_at": string, // ISO date
  "detected_substances": [
    {
      "ingredient_name": "Name from recipe",
      "matched_mrls_name": "Name found in MRLS/OEKOTEX PDF",
      "cas_number": "CAS Number found",
      "restriction_type": "Banned" | "Limited" | "Usage Ban",
      "limit_value": "e.g. 50 ppm or 'Detection Limit'",
      "page_number": number, // The page number in the PDF where this substance is listed.
      "status": "FAIL" | "WARNING" | "PASS", // FAIL if banned/over limit, WARNING if close to limit or needs testing, PASS if present but allowed under certain conditions.
      "explanation": "Brief explanation of the restriction and why it matched."
    }
  ],
  "summary": "A brief execution summary of the compliance check.",
  "recommendations": ["List of actions to take if non-compliant"]
}

If no matches are found, "detected_substances" should be an empty array and "is_compliant" should be true.
`;

export async function checkRecipeCompliance(formData: FormData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('Yetkisiz işlem. Lütfen giriş yapın.');
        }

        const recipeId = formData.get('recipeId') as string;
        const files = formData.getAll('files') as File[];

        if (!recipeId || files.length === 0) {
            throw new Error('Reçete ID veya dosyalar eksik.');
        }

        // 1. Get Recipe Details
        const supabase = await createClient();
        const { data: recipe, error: recipeError } = await supabase
            .from('recipes')
            .select(`
                *,
                product:products(name, code),
                items:recipe_items(
                    amount,
                    material:materials(name, code, cas_number, category)
                )
            `)
            .eq('id', recipeId)
            .single();

        if (recipeError || !recipe) {
            throw new Error('Reçete bulunamadı.');
        }

        // Prepare Ingredients List for Prompt
        const ingredientsList = recipe.items.map((item: any) => {
            return `- Material: ${item.material.name} (Code: ${item.material.code}) | CAS: ${item.material.cas_number || 'N/A'} | Amount: ${item.amount}`;
        }).join('\n');

        // 2. Get API Key
        const { data: apiKey } = await getSettingByKey('GOOGLE_GENERATIVE_AI_API_KEY');
        if (!apiKey) {
            throw new Error('Gemini API anahtarı ayarlanmamış.');
        }

        // 3. Prepare Gemini Request
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-3-flash-preview',
            systemInstruction: SYSTEM_INSTRUCTION,
        });

        // Convert All Files to Base64 parts
        const parts = await Promise.all(files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            return {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type || 'application/pdf',
                },
            };
        }));

        const prompt = `
        Here is the recipe to check:
        
        Recipe Name: ${recipe.product.name} (${recipe.product.code})
        Ingredients:
        ${ingredientsList}

        Please analyze the provided documents (MRLS, OEKOTEX, etc.) and cross-reference them with these ingredients. 
        If an ingredient is found in ANY of the documents as restricted or banned, report it.
        Also check for any special conditions or limits defined in the documents.
        Return ONLY the JSON object as specified in the system instructions. Do not add markdown formatting.
        `;

        // 4. Call Gemini API
        const result = await model.generateContent([
            prompt,
            ...parts,
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean markdown code blocks if present
        const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();

        try {
            const parsedResult = JSON.parse(jsonStr);
            return { success: true, data: parsedResult };
        } catch (jsonError) {
            console.error('JSON Parse Error:', jsonError);
            console.log('Raw Text:', text);
            return { success: false, error: 'AI yanıtı işlenemedi. Lütfen tekrar deneyin.' };
        }

    } catch (error: any) {
        console.error('Compliance Check Error:', error);
        return { success: false, error: error.message || 'Bir hata oluştu.' };
    }
}
