import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RecipeEditor from '@/components/recipes/RecipeEditor';
import { getRecipeById } from '@/app/actions/recipes';
import { getProducts } from '@/app/actions/products';

export const metadata: Metadata = {
    title: 'Reçete Düzenle | Kimyasal Takip',
    description: 'Mevcut reçeteyi düzenle',
};

export default async function EditRecipePage({
    params,
}: {
    params: { id: string };
}) {
    const { data: recipe, error } = await getRecipeById(params.id);

    if (error || !recipe) {
        notFound();
    }

    // Check if recipe can be edited
    if (recipe.status === 'approved') {
        return (
            <div className="p-8">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
                        Düzenleme İzni Yok
                    </h2>
                    <p className="text-red-800 dark:text-red-200">
                        Onaylanmış reçeteler düzenlenemez. Yeni bir versiyon oluşturabilirsiniz.
                    </p>
                </div>
            </div>
        );
    }

    // Get all products for selection
    const { data: products } = await getProducts();

    return <RecipeEditor products={products || []} recipeId={recipe.id} />;
}
