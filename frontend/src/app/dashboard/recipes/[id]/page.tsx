import { Metadata } from "next";
import { notFound } from "next/navigation";
import RecipeDetailsView from "../../../../components/recipes/RecipeDetailsView";
import { getRecipeById } from "../../../actions/recipes";
import { getCurrentUser } from "../../../actions/auth";

// Generate dynamic metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data: recipe } = await getRecipeById(id);

  return {
    title: recipe
      ? `Reçete: ${recipe.version_code} | Kimyasal Takip`
      : "Reçete Bulunamadı",
    description: "Reçete detayları ve onay bilgileri",
  };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: recipe, error } = await getRecipeById(id);

  if (error || !recipe) {
    notFound();
  }

  // Transform generic Supabase response if needed, but getRecipeById returns detailed info.
  // Casting to any for component flexibility while maintaining type safety in the component itself.
  const currentUser = await getCurrentUser();
  return <RecipeDetailsView recipe={recipe as any} currentUser={currentUser} />;
}
