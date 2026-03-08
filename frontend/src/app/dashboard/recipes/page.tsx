import { Metadata } from "next";
import RecipeManagementClient from "../../../components/recipes/RecipeManagementClient";
import { getRecipes } from "../../actions/recipes";
import { getCurrentUser } from "../../actions/auth";

export const metadata: Metadata = {
  title: "Reçete Yönetimi | Kimyasal Takip",
  description: "Ürün reçetelerini oluşturun ve yönetin",
};

export default function RecipesPage() {
  return <RecipeManagementClient />;
}
