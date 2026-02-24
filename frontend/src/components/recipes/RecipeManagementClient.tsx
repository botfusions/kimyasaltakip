'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRecipes } from '@/app/actions/recipes';
import { getCurrentUser } from '@/app/actions/auth';
import SignatureVerificationModal from './SignatureVerificationModal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Recipe {
    id: string;
    version_code: string;
    status: string;
    notes: string | null;
    created_at: string;
    approved_at: string | null;
    order_code?: string | null;
    customer_name?: string | null;
    color_name?: string | null;
    product: {
        id: string;
        code: string;
        name: string;
    } | null;
    created_by_user: {
        id: string;
        name: string;
    };
    approved_by_user: {
        id: string;
        name: string;
        signature_id: string;
    } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    draft: { label: 'Taslak', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' },
    pending: { label: 'Müşteri Bekliyor', color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' },
    approved: { label: 'Onaylandı', color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' },
    rejected: { label: 'Revize Gerekli', color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' },
};

export default function RecipeManagementClient() {
    const router = useRouter();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [userProfile, setUserProfile] = useState<any>(null);

    // Modal states
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [showSignatureModal, setShowSignatureModal] = useState(false);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Load recipes
    useEffect(() => {
        loadRecipes();
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = recipes;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (r) =>
                    r.version_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (r.order_code && r.order_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (r.customer_name && r.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (r.product && r.product.name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter((r) => r.status === statusFilter);
        }

        setFilteredRecipes(filtered);
    }, [searchTerm, statusFilter, recipes]);

    const loadRecipes = async () => {
        setIsLoading(true);
        setError('');

        const [recipesResult, userResult] = await Promise.all([
            getRecipes(),
            getCurrentUser()
        ]);

        setUserProfile(userResult);

        if (recipesResult.error) {
            setError(recipesResult.error);
        } else {
            setRecipes(recipesResult.data || []);
        }

        setIsLoading(false);
    };

    const handleApprove = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setShowSignatureModal(true);
    };

    const handleSignatureModalClose = (approved?: boolean) => {
        setShowSignatureModal(false);
        setSelectedRecipe(null);

        if (approved) {
            loadRecipes(); // Reload after successful approval
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Reçete Yönetimi
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Ürün reçetelerini oluşturun, yönetin ve müşteri onayından sonra üretime geçirin
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
            )}

            {/* Actions Bar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                    <Input
                        type="search"
                        placeholder="Reçete ara (iş emri, müşteri, ürün)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                    <option value="all">Tüm Durumlar</option>
                    {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>

                {/* New Recipe Button */}
                {['lab', 'admin'].includes(userProfile?.role) && (
                    <Button
                        variant="primary"
                        onClick={() => router.push('/dashboard/recipes/new')}
                    >
                        + Yeni Reçete
                    </Button>
                )}
            </div>

            {/* Recipes Table */}
            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredRecipes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm || statusFilter !== 'all'
                            ? 'Filtreye uygun reçete bulunamadı'
                            : 'Henüz reçete eklenmemiş'}
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        İş Emri / Versiyon
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Müşteri / Renk
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Durum
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Oluşturan
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Tarih
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {filteredRecipes.map((recipe) => (
                                    <tr
                                        key={recipe.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {recipe.order_code || '-'}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                v{recipe.version_code}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {recipe.customer_name || recipe.product?.name || 'Genel'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {recipe.color_name || '-'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[recipe.status]?.color ||
                                                    'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                                    }`}
                                            >
                                                {STATUS_LABELS[recipe.status]?.label || recipe.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {recipe.created_by_user.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(recipe.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                            <button
                                                onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                            >
                                                Görüntüle
                                            </button>
                                            {recipe.status !== 'approved' && ['lab', 'admin'].includes(userProfile?.role) && (
                                                <button
                                                    onClick={() => router.push(`/dashboard/recipes/${recipe.id}/edit`)}
                                                    className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                                                >
                                                    Düzenle
                                                </button>
                                            )}
                                            {recipe.status === 'draft' && ['lab', 'admin'].includes(userProfile?.role) && (
                                                <button
                                                    onClick={() => handleApprove(recipe)}
                                                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors font-semibold"
                                                >
                                                    ✓ Onayla
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Signature Verification Modal */}
            {showSignatureModal && selectedRecipe && (
                <SignatureVerificationModal
                    recipe={selectedRecipe}
                    onClose={handleSignatureModalClose}
                />
            )}
        </div>
    );
}
