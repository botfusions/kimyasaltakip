import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("--- Starting Seeding v2 (Final Corrected) ---");

  try {
    const { data: userData } = await supabase
      .from("kts_users")
      .select("id")
      .limit(1)
      .single();
    const userId = userData?.id;
    if (!userId) {
      console.error("No users found.");
      process.exit(1);
    }
    console.log("Using User ID:", userId);

    // 1. Standard
    const stdPayload = {
      name: "ZDHC MRSL v3.1",
      description: "Zero Discharge of Hazardous Chemicals",
      version: "3.1",
      is_active: true,
    };

    // Select or Insert Standard
    let { data: standard } = await supabase
      .from("kts_compliance_standards")
      .select("id")
      .eq("name", stdPayload.name)
      .single();
    if (!standard) {
      const { data: newStd, error: stdErr } = await supabase
        .from("kts_compliance_standards")
        .insert(stdPayload)
        .select("id")
        .single();
      if (stdErr) throw stdErr;
      standard = newStd;
    }
    console.log("Standard ID:", standard.id);

    // 2. Restricted Substance
    const subPayload = {
      chemical_name: "EUROCTIVE RED FTR",
      standard_id: standard.id,
      cas_number: "RESTRICT-RED-001",
      limit_value: "0",
      limit_unit: "ppm",
    };

    let { data: substance } = await supabase
      .from("kts_restricted_substances")
      .select("id")
      .eq("chemical_name", subPayload.chemical_name)
      .single();
    if (!substance) {
      const { data: newSub, error: subErr } = await supabase
        .from("kts_restricted_substances")
        .insert(subPayload)
        .select("id")
        .single();
      if (subErr) throw subErr;
      substance = newSub;
    }
    console.log("Restricted Substance ID:", substance.id);

    // 3. Materials
    const materials = [
      { code: "ALK-001", name: "ALKALİ", unit: "g", category: "Kimyasal" },
      { code: "SAB-001", name: "SABUN", unit: "g", category: "Kimyasal" },
      {
        code: "BOY-001",
        name: "EUROCTIVE YELLOW FTR",
        unit: "%",
        category: "Boya",
      },
      {
        code: "BOY-002",
        name: "EUROCTIVE RED FTR",
        unit: "%",
        category: "Boya",
      },
      {
        code: "BOY-003",
        name: "EUROCTIVE BRILLIANT BLUE FTR",
        unit: "%",
        category: "Boya",
      },
    ];

    const materialMap = new Map();
    for (const mat of materials) {
      let { data: m } = await supabase
        .from("kts_materials")
        .select("id")
        .eq("code", mat.code)
        .single();
      if (!m) {
        const { data: newM, error: me } = await supabase
          .from("kts_materials")
          .insert({ ...mat, is_active: true })
          .select("id")
          .single();
        if (me) {
          console.error(`Error with material ${mat.code}:`, me);
          continue;
        }
        m = newM;
      }
      materialMap.set(mat.code, m.id);
    }
    console.log("Materials Mapped:", materialMap.size);

    // 4. Usage Type
    let { data: usageType } = await supabase
      .from("kts_usage_types")
      .select("id")
      .eq("name", "Üretim")
      .single();
    if (!usageType) {
      const { data: newUt } = await supabase
        .from("kts_usage_types")
        .insert({ name: "Üretim", is_active: true })
        .select("id")
        .single();
      usageType = newUt;
    }

    // 5. Product
    let { data: product } = await supabase
      .from("kts_products")
      .select("id")
      .eq("code", "ELI 1414-HIPS-1")
      .single();
    if (!product) {
      const { data: newP } = await supabase
        .from("kts_products")
        .insert({
          code: "ELI 1414-HIPS-1",
          name: "BEJ (30/1 Penye)",
          created_by: userId,
          is_active: true,
        })
        .select("id")
        .single();
      product = newP;
    }

    // 6. Recipe
    const recipePayload = {
      version_code: "94275",
      product_id: product.id,
      usage_type_id: usageType.id,
      created_by: userId,
      status: "draft",
      recipe_name_no: "RATEKS-94275",
      color_code: "BNXKB045521",
    };

    let { data: recipe } = await supabase
      .from("kts_recipes")
      .select("id")
      .eq("version_code", recipePayload.version_code)
      .single();
    if (recipe) {
      await supabase
        .from("kts_recipes")
        .update(recipePayload)
        .eq("id", recipe.id);
    } else {
      const { data: newR, error: re } = await supabase
        .from("kts_recipes")
        .insert(recipePayload)
        .select("id")
        .single();
      if (re) throw re;
      recipe = newR;
    }
    console.log("Recipe ID:", recipe.id);

    // 7. Recipe Items
    await supabase.from("kts_recipe_items").delete().eq("recipe_id", recipe.id);
    const items = [
      { code: "ALK-001", qty: 10, pct: 0.5 },
      { code: "SAB-001", qty: 5, pct: 0.2 },
      { code: "BOY-001", qty: 0, pct: 0.05 },
      { code: "BOY-002", qty: 0, pct: 0.12 },
      { code: "BOY-003", qty: 0, pct: 0.03 },
    ];

    const insertData = items
      .map((item) => {
        const mId = materialMap.get(item.code);
        if (!mId) return null;
        return {
          recipe_id: recipe.id,
          material_id: mId,
          quantity: item.qty,
          percentage: item.pct,
          unit: "kg",
          sort_order: 1,
        };
      })
      .filter(Boolean);

    const { error: insertError } = await supabase
      .from("kts_recipe_items")
      .insert(insertData);
    if (insertError) throw insertError;

    console.log("--- Seeding Successful ---");
    process.exit(0);
  } catch (err) {
    console.error("Seeding Failed:", err);
    process.exit(1);
  }
}

seed();
