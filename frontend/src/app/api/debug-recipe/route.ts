import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "../../../lib/supabase/server";
import { getRecipes, getRecipeById } from "../../actions/recipes";

export const dynamic = "force-dynamic";

export async function GET() {
  const debugInfo: any = {
    session: null,
    rlsCheck: {},
    actions: {},
    adminCheck: {},
  };

  try {
    const supabase = await createClient(); // Standard client
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    debugInfo.session = {
      hasUser: !!user,
      userId: user?.id,
      error: userError?.message,
    };

    // 1. RLS Check (Standard Client)
    // Even if no user is logged in, public policies might allow read.
    // If user IS logged in (via cookie), this tests their access.

    // Products
    const { count: productsCount, error: productsError } = await supabase
      .from("kts_products")
      .select("*", { count: "exact", head: true });
    debugInfo.rlsCheck.products = {
      count: productsCount,
      error: productsError?.message,
    };

    // Materials
    const { count: materialsCount, error: materialsError } = await supabase
      .from("kts_materials")
      .select("*", { count: "exact", head: true });
    debugInfo.rlsCheck.materials = {
      count: materialsCount,
      error: materialsError?.message,
    };

    // Recipes
    const { count: recipesCount, error: recipesError } = await supabase
      .from("kts_recipes")
      .select("*", { count: "exact", head: true });
    debugInfo.rlsCheck.recipes = {
      count: recipesCount,
      error: recipesError?.message,
    };

    // 2. Test Actions
    try {
      console.log("Testing getRecipes action...");
      const recipesResult = await getRecipes();
      debugInfo.actions.getRecipes = {
        success: !recipesResult.error,
        count: recipesResult.data?.length,
        error: recipesResult.error,
      };
    } catch (e: any) {
      debugInfo.actions.getRecipes = { error: e.message };
    }

    // 3. Admin Check
    const adminClient = createAdminClient();

    // Check recipes count (Admin)
    const { count: adminRecipesCount } = await adminClient
      .from("kts_recipes")
      .select("*", { count: "exact", head: true });
    const { count: adminProductsCount } = await adminClient
      .from("kts_products")
      .select("*", { count: "exact", head: true });
    const { count: adminMaterialsCount } = await adminClient
      .from("kts_materials")
      .select("*", { count: "exact", head: true });

    debugInfo.adminCheck = {
      recipes: adminRecipesCount,
      products: adminProductsCount,
      materials: adminMaterialsCount,
    };

    return NextResponse.json(debugInfo);
  } catch (e: any) {
    return NextResponse.json(
      {
        criticalError: e.message,
        stack: e.stack,
        partialDebug: debugInfo,
      },
      { status: 500 },
    );
  }
}
