import { Metadata } from "next";
import RecipeEditor from "../../../../components/recipes/RecipeEditor";
import { getProducts } from "../../../actions/products";
import { getRecipes } from "../../../actions/recipes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Yeni Reçete | Kimyasal Takip",
  description: "Yeni reçete oluştur",
};

export default async function NewRecipePage() {
  // Get all products for selection
  const { data: products } = await getProducts();

  return <RecipeEditor products={products || []} />;
}
