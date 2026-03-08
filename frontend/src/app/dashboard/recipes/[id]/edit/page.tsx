import { Metadata } from "next";
import { notFound } from "next/navigation";
import RecipeEditor from "../../../../../components/recipes/RecipeEditor";
import { getRecipeById } from "../../../../actions/recipes";
import { getProducts } from "../../../../actions/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reçete Düzenle | Kimyasal Takip",
  description: "Mevcut reçeteyi düzenle",
};

export default async function EditRecipePage({
  params,
}: {
  params: { id: string };
}) {
  console.log("Edit Page - Params ID:", params.id);
  const result = await getRecipeById(params.id);
  console.log("Edit Page - Fetch Result:", result);
  const { data: recipe, error } = result;

  if (error || !recipe) {
    return (
      <div className="p-8 text-red-600">
        <h1 className="text-2xl font-bold">Hata</h1>
        <p>Reçete yüklenemedi.</p>
        <div className="bg-gray-100 p-4 rounded mt-4 overflow-auto">
          <pre>{JSON.stringify({ error, paramsId: params.id }, null, 2)}</pre>
        </div>
      </div>
    );
  }

  // Check if recipe can be edited
  if (recipe.status === "approved") {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
            Düzenleme İzni Yok
          </h2>
          <p className="text-red-800 dark:text-red-200">
            Onaylanmış reçeteler düzenlenemez. Yeni bir versiyon
            oluşturabilirsiniz.
          </p>
        </div>
      </div>
    );
  }

  // Get all products for selection
  const { data: products } = await getProducts();

  return <RecipeEditor products={products || []} recipeId={recipe.id} />;
}
