'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import SignatureVerificationModal from './SignatureVerificationModal';
import { rejectRecipeForRevision } from '@/app/actions/recipes';
import { generateRecipePDF } from '@/utils/recipePdf';

interface RecipeItem {
    id: string;
    material: {
        id: string;
        code: string;
        name: string;
        unit: string;
    };
    quantity: number;
    percentage: number;
    notes: string | null;
}

interface Recipe {
    id: string;
    version_code: string;
    status: string;
    notes: string | null;
    created_at: string;
    approved_at: string | null;
    product: {
        id: string;
        code: string;
        name: string;
        unit: string;
    };
    created_by_user: {
        id: string;
        name: string;
        email: string;
    };
    approved_by_user: {
        id: string;
        name: string;
        email: string;
        signature_id: string;
    } | null;
    recipe_items: RecipeItem[];
}

interface Props {
    recipe: Recipe;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    draft: { label: 'Taslak', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' },
    pending: { label: 'Müşteri Bekliyor', color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' },
    approved: { label: 'Onaylandı', color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' },
    rejected: { label: 'Revize Gerekli', color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' },
};

export default function RecipeDetailsView({ recipe: initialRecipe }: Props) {
    const router = useRouter();
    const [recipe, setRecipe] = useState(initialRecipe);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSignatureModalClose = (approved?: boolean) => {
        setShowSignatureModal(false);
        if (approved) {
            router.refresh();
            // In a real app, we might fetch the updated recipe data here
            // but for now, we'll rely on router.refresh() or the user reloading
            window.location.reload();
        }
    };

    const handleReject = async () => {
        const reason = window.prompt('Revize nedenini girin:');
        if (reason === null) return;

        setIsLoading(true);
        const result = await rejectRecipeForRevision(recipe.id, reason);
        if (result.success) {
            window.location.reload();
        } else {
            alert(result.error || 'Bir hata oluştu');
        }
        setIsLoading(false);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const totalQuantity = recipe.recipe_items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Button
                        variant="secondary"
                        onClick={() => router.push('/dashboard/recipes')}
                        className="mb-4"
                    >
                        ← Reçete Listesine Dön
                    </Button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Reçete: {recipe.version_code}
                        </h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_LABELS[recipe.status]?.color}`}>
                            {STATUS_LABELS[recipe.status]?.label}
                        </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Ürün: <span className="font-semibold text-gray-900 dark:text-white">{recipe.product.name}</span> ({recipe.product.code})
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {recipe.status !== 'approved' && (
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => router.push(`/dashboard/recipes/${recipe.id}/edit`)}
                                disabled={isLoading}
                            >
                                Düzenle
                            </Button>
                            <Button
                                variant="primary"
                                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                                onClick={() => setShowSignatureModal(true)}
                                disabled={isLoading}
                            >
                                ✓ Onayla (Üretime Aç)
                            </Button>
                        </>
                    )}
                    {(recipe.status === 'draft' || recipe.status === 'pending') && (
                        <Button
                            variant="secondary"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={handleReject}
                            disabled={isLoading}
                        >
                            Revize İste
                        </Button>
                    )}
                    {recipe.status === 'approved' && (
                        <Button
                            variant="primary"
                            onClick={() => generateRecipePDF(recipe)}
                            disabled={isLoading}
                        >
                            📄 PDF İndir
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Material List */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Malzeme Listesi</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Malzeme</th>
                                        <th className="px-6 py-3 text-right">Miktar</th>
                                        <th className="px-6 py-3 text-right">Oran (%)</th>
                                        <th className="px-6 py-3 text-left">Notlar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                    {recipe.recipe_items.map((item) => (
                                        <tr key={item.id} className="text-sm">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{item.material.name}</div>
                                                <div className="text-xs text-gray-500">{item.material.code}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {item.quantity} {item.material.unit}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono">
                                                {item.percentage}%
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                {item.notes || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 dark:bg-gray-700/30 font-bold">
                                    <tr>
                                        <td className="px-6 py-4 text-gray-900 dark:text-white">TOPLAM</td>
                                        <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                                            {totalQuantity.toFixed(2)} {recipe.product.unit}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-900 dark:text-white">100.00%</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Notes Section */}
                    {recipe.notes && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reçete Notları</h2>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{recipe.notes}</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Metadata */}
                <div className="space-y-6">
                    {/* Creator Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Oluşturan</h2>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                                {recipe.created_by_user.name.charAt(0)}
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white">{recipe.created_by_user.name}</div>
                                <div className="text-xs text-gray-500">{recipe.created_by_user.email}</div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">
                            Tarih: {formatDate(recipe.created_at)}
                        </div>
                    </div>

                    {/* Approver Info */}
                    {recipe.status === 'approved' && recipe.approved_by_user && (
                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg shadow-sm p-6">
                            <h2 className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider mb-4 underline decoration-2 decoration-green-300 underline-offset-4">✓ Onaylayan (Dijital İmza)</h2>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-300 font-bold border-2 border-green-300">
                                    {recipe.approved_by_user.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{recipe.approved_by_user.name}</div>
                                    <div className="text-xs text-gray-500">{recipe.approved_by_user.email}</div>
                                </div>
                            </div>
                            <div className="space-y-2 mt-4 pt-4 border-t border-green-200 dark:border-green-800/50">
                                <div className="flex justify-between text-xs">
                                    <span className="text-green-700 dark:text-green-400 font-medium">İmza ID:</span>
                                    <span className="font-mono font-bold text-green-800 dark:text-green-200">
                                        {recipe.approved_by_user.signature_id.substring(0, 2)}**{recipe.approved_by_user.signature_id.substring(4)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-green-700 dark:text-green-400 font-medium">Onay Tarihi:</span>
                                    <span className="text-green-800 dark:text-green-200">{formatDate(recipe.approved_at || '')}</span>
                                </div>
                            </div>
                            <div className="mt-4 p-2 bg-white/50 dark:bg-black/20 rounded text-[10px] text-green-700 dark:text-green-400 italic text-center">
                                ISO 9001:2015 Kalite Standartlarına Uygun Olarak Dijital Olarak Onaylanmıştır.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Signature Modal */}
            {showSignatureModal && (
                <SignatureVerificationModal
                    recipe={recipe}
                    onClose={handleSignatureModalClose}
                />
            )}
        </div>
    );
}
