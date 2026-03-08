import { createClient } from "../../lib/supabase/server";
import { getCurrentUser } from "./auth";

/**
 * Check if a recipe complies with all active standards.
 */
export async function checkRecipeCompliance(recipeId: string) {
  const currentUser = await getCurrentUser();
  const supabase = await createClient();

  // 1. Get Recipe Items & Materials
  // Note: We use the kts_ prefixes as per the renamed schema
  const { data: recipe, error: recipeError } = await supabase
    .from("kts_recipes")
    .select(
      `
            id,
            recipe_items:kts_recipe_items (
                material:kts_materials (
                    id,
                    name,
                    cas_number
                )
            )
        `,
    )
    .eq("id", recipeId)
    .single();

  if (recipeError || !recipe) {
    console.error("Compliance Check Error: Recipe not found", recipeError);
    return { error: "Reçete veya malzeme bulunamadı" };
  }

  const recipeItems = (recipe as any).recipe_items || [];

  // Filter items that have a CAS number
  const itemsWithCas = recipeItems
    .map((item: any) => item.material)
    .filter((m: any) => m && m.cas_number);

  if (itemsWithCas.length === 0) {
    return {
      success: true,
      status: "pass",
      message: "Kontrol edilecek CAS numaralı malzeme bulunamadı.",
      violations: [],
    };
  }

  const casList = itemsWithCas.map((m: any) => m.cas_number);

  // 2. Check against Restricted Substances
  const { data: restrictions, error: restrictionError } = await supabase
    .from("kts_restricted_substances")
    .select(
      `
            *,
            standard:kts_compliance_standards (id, name)
        `,
    )
    .in("cas_number", casList);

  if (restrictionError) {
    console.error(
      "Compliance Check Error: Restriction query failed",
      restrictionError,
    );
    return { error: "Kısıtlı madde sorgusu başarısız oldu" };
  }

  const violations: any[] = [];

  if (restrictions && restrictions.length > 0) {
    for (const restriction of restrictions) {
      const material = itemsWithCas.find(
        (m: any) => m.cas_number === restriction.cas_number,
      );
      violations.push({
        standard: (restriction.standard as any)?.name,
        standard_id: (restriction.standard as any)?.id,
        material: material?.name,
        cas: restriction.cas_number,
        limit: `${restriction.limit_value} ${restriction.limit_unit}`,
        status: "FAIL",
      });
    }
  }

  // 3. Save Compliance Check Records
  // Get all active standards to ensure we cover ones that PASSED as well
  const { data: allStandards } = await supabase
    .from("kts_compliance_standards")
    .select("id, name")
    .eq("is_active", true);

  if (allStandards) {
    for (const std of allStandards) {
      const stdViolations = violations.filter((v) => v.standard_id === std.id);
      const status = stdViolations.length > 0 ? "fail" : "pass";

      // Delete old check first to simulate upsert (assuming no unique constraint for simplicity or to be safe)
      await supabase
        .from("kts_compliance_checks")
        .delete()
        .eq("recipe_id", recipeId)
        .eq("standard_id", std.id);

      await supabase.from("kts_compliance_checks").insert({
        recipe_id: recipeId,
        standard_id: std.id,
        status: status,
        report:
          stdViolations.length > 0
            ? { violations: stdViolations }
            : { message: "All clear" },
        checked_at: new Date().toISOString(),
        checked_by: currentUser?.id,
      });
    }
  }

  const hasFailures = violations.length > 0;

  return {
    success: true,
    status: hasFailures ? "fail" : "pass",
    violations,
    message: hasFailures
      ? `${violations.length} adet kısıtlı madde uyarısı tespit edildi.`
      : "Reçete tüm uyumluluk standartlarına uygundur.",
  };
}
