import { createAdminClient } from "../../../lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAdminClient();

  try {
    // 1. Get a valid user
    let userId: string;
    const { data: specificUser } = await supabase.auth.admin.listUsers();
    const targetUser = specificUser?.users.find(
      (u) => u.email === "selam@botfusions.com",
    );

    if (targetUser) {
      userId = targetUser.id;
    } else {
      const { data: anyUser, error: userError } = await supabase
        .from("kts_users")
        .select("id")
        .limit(1)
        .single();

      if (userError || !anyUser) {
        return NextResponse.json(
          { error: "No users found", details: userError },
          { status: 500 },
        );
      }
      userId = anyUser.id;
    }

    // 2. Create Compliance Standard if not exists
    let standardId: string;
    const { data: existingStandard } = await supabase
      .from("kts_compliance_standards")
      .select("id")
      .eq("name", "ZDHC MRSL v3.1")
      .single();

    if (existingStandard) {
      standardId = existingStandard.id;
    } else {
      const { data: newStandard, error: standardError } = await supabase
        .from("kts_compliance_standards")
        .insert({
          name: "ZDHC MRSL v3.1",
          description:
            "Zero Discharge of Hazardous Chemicals Manufacturing Restricted Substances List",
          organization: "ZDHC",
          version: "3.1",
          is_active: true,
        })
        .select("id")
        .single();

      if (standardError || !newStandard) {
        return NextResponse.json(
          { error: "Failed to create standard", details: standardError },
          { status: 500 },
        );
      }
      standardId = newStandard.id;
    }

    // 3. Create Restricted Substance "EUROCTIVE RED FTR"
    let restrictedSubstanceId: string;
    const { data: existingSubstance } = await supabase
      .from("kts_restricted_substances")
      .select("id")
      .eq("name", "EUROCTIVE RED FTR")
      .single();

    if (existingSubstance) {
      restrictedSubstanceId = existingSubstance.id;
    } else {
      const { data: newSubstance, error: substanceError } = await supabase
        .from("kts_restricted_substances")
        .insert({
          name: "EUROCTIVE RED FTR",
          description:
            "Restricted red dye due to potential hazardous byproducts",
          cas_number: "RESTRICT-001",
          is_prohibited: true,
          is_active: true,
        })
        .select("id")
        .single();

      if (substanceError || !newSubstance) {
        return NextResponse.json(
          {
            error: "Failed to create restricted substance",
            details: substanceError,
          },
          { status: 500 },
        );
      }
      restrictedSubstanceId = newSubstance.id;

      // Link to standard
      await supabase.from("kts_standards_restricted").insert({
        standard_id: standardId,
        substance_id: restrictedSubstanceId,
        limit_value: "0",
        unit: "ppm",
      });
    }

    // 4. Create Usage Type (Üretim)
    let usageTypeId: string;
    const { data: existingUsageType } = await supabase
      .from("kts_usage_types")
      .select("id")
      .eq("name", "Üretim")
      .single();

    if (existingUsageType) {
      usageTypeId = existingUsageType.id;
    } else {
      const { data: newUsageType, error: usageTypeError } = await supabase
        .from("kts_usage_types")
        .insert({
          name: "Üretim",
          description: "Üretim amaçlı reçeteler",
          is_active: true,
        })
        .select("id")
        .single();
      if (usageTypeError)
        return NextResponse.json({
          error: "Usage type error",
          details: usageTypeError,
        });
      usageTypeId = newUsageType.id;
    }

    // 5. Create Materials from HTML extraction
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
      }, // This one is restricted
      {
        code: "BOY-003",
        name: "EUROCTIVE BRILLIANT BLUE FTR",
        unit: "%",
        category: "Boya",
      },
      {
        code: "DIS-001",
        name: "Dispers Baskı Patı",
        unit: "g",
        category: "Kimyasal",
      },
      { code: "TUZ-001", name: "SIVI TUZ", unit: "g", category: "Kimyasal" },
      { code: "IYO-001", name: "İYON TUTUCU", unit: "g", category: "Kimyasal" },
      { code: "ASI-001", name: "ASİT", unit: "g", category: "Kimyasal" },
      { code: "PH-007", name: "PH = 7", unit: "%", category: "Ph Düzenleyici" },
      { code: "ASI-002", name: "ASETİK ASİT", unit: "g", category: "Kimyasal" },
      { code: "YUM-001", name: "YUMUŞATICI", unit: "%", category: "Kimyasal" },
      {
        code: "PH-005",
        name: "PH = 5.3 - 5.8",
        unit: "%",
        category: "Ph Düzenleyici",
      },
    ];

    const materialMap = new Map<string, string>();
    for (const mat of materials) {
      const { data: existing } = await supabase
        .from("kts_materials")
        .select("id")
        .eq("code", mat.code)
        .single();

      let matId = existing?.id;
      if (!matId) {
        const { data: newMat, error: createError } = await supabase
          .from("kts_materials")
          .insert({ ...mat, is_active: true, created_by: userId })
          .select("id")
          .single();
        if (createError) continue;
        matId = newMat.id;
      }
      materialMap.set(mat.code, matId);
    }

    // 6. Create Product (Demo Fabric)
    let productId: string;
    const { data: existingProduct } = await supabase
      .from("kts_products")
      .select("id")
      .eq("code", "ELI 1414-HIPS-1")
      .single();

    if (existingProduct) {
      productId = existingProduct.id;
    } else {
      const { data: newProduct, error: productError } = await supabase
        .from("kts_products")
        .insert({
          code: "ELI 1414-HIPS-1",
          name: "BEJ (30/1 Penye)",
          created_by: userId,
          is_active: true,
        })
        .select("id")
        .single();
      if (productError)
        return NextResponse.json({
          error: "Product error",
          details: productError,
        });
      productId = newProduct.id;
    }

    // 7. Create Recipe
    const recipeData = {
      version_code: "94275",
      product_id: productId,
      usage_type_id: usageTypeId,
      created_by: userId,
      status: "draft",
      total_weight: 1602.24,
      batch_ratio: "1/10",
      notes: "Demo recipe created from fatura/reçete (1).html",
      color_name: "BEJ",
      color_code: "BNXKB045521",
    };

    const { data: recipe, error: recipeError } = await supabase
      .from("kts_recipes")
      .upsert(recipeData, { onConflict: "version_code" })
      .select("id")
      .single();

    if (recipeError)
      return NextResponse.json({ error: "Recipe error", details: recipeError });

    // 8. Create Recipe Items
    // Using sample percentages for demo
    const items = [
      { code: "ALK-001", quantity: 10, percentage: 0.5 },
      { code: "SAB-001", quantity: 5, percentage: 0.2 },
      { code: "BOY-001", quantity: 0, percentage: 0.05 },
      { code: "BOY-002", quantity: 0, percentage: 0.12 }, // Restricted
      { code: "BOY-003", quantity: 0, percentage: 0.03 },
    ];

    await supabase.from("kts_recipe_items").delete().eq("recipe_id", recipe.id);

    for (const item of items) {
      const matId = materialMap.get(item.code);
      if (!matId) continue;

      await supabase.from("kts_recipe_items").insert({
        recipe_id: recipe.id,
        material_id: matId,
        quantity: item.quantity,
        percentage: item.percentage,
        unit: "kg",
        sort_order: 1,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Seed v2 complete",
      data: { recipeId: recipe.id },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Exception", details: err.message },
      { status: 500 },
    );
  }
}
