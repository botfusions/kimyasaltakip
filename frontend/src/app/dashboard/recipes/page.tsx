import { Metadata } from 'next';
import RecipeManagementClient from '@/components/recipes/RecipeManagementClient';

export const metadata: Metadata = {
    title: 'Reçete Yönetimi | Kimyasal Takip',
    description: 'Ürün reçetelerini oluşturun ve yönetin',
};

export default function RecipesPage() {
    return <RecipeManagementClient />;
}
