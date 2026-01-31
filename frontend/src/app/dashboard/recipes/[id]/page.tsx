import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RecipeDetailsView from '@/components/recipes/RecipeDetailsView';
import { getRecipeById } from '@/app/actions/recipes';

// Generate dynamic metadata
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const { data: recipe } = await getRecipeById(params.id);

    return {
        title: recipe ? `Reçete: ${recipe.version_code} | Kimyasal Takip` : 'Reçete Bulunamadı',
        description: 'Reçete detayları ve onay bilgileri',
    };
}

export default async function RecipePage({
    params,
}: {
    params: { id: string };
}) {
    const { data: recipe, error } = await getRecipeById(params.id);

    if (error || !recipe) {
        notFound();
    }

    // Transform generic Supabase response if needed, but getRecipeById returns detailed info.
    // Casting to any for component flexibility while maintaining type safety in the component itself.
    return <RecipeDetailsView recipe={recipe as any} />;
}
