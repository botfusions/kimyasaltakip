'use client';

import { useState, FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { approveRecipe } from '@/app/actions/recipes';

interface Recipe {
    id: string;
    version_code: string;
    order_code?: string | null;
    product?: {
        name: string;
        code: string;
    } | null;
    recipe_items?: Array<{
        material: {
            name: string;
        };
        quantity: number;
    }>;
}

interface Props {
    recipe: Recipe;
    onClose: (approved?: boolean) => void;
}

export default function SignatureVerificationModal({ recipe, onClose }: Props) {
    const [signatureId, setSignatureId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const totalMaterials = recipe.recipe_items?.length || 0;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!signatureId || signatureId.length < 4 || signatureId.length > 6) {
            setError('İmza ID 4-6 haneli olmalıdır');
            setIsLoading(false);
            return;
        }

        try {
            const result = await approveRecipe(recipe.id, signatureId);

            if (result.error) {
                setError(result.error);
            } else {
                onClose(true); // Success - recipe approved
            }
        } catch (err) {
            setError('Beklenmeyen bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={() => onClose(false)}
            title="Reçete Onayı - İmza ID Doğrulama"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Recipe Summary */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">
                        Onaylanacak Reçete Bilgileri
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-blue-700 dark:text-blue-300">İş Emri No:</span>
                            <span className="font-mono font-semibold text-blue-900 dark:text-blue-100">
                                {recipe.order_code || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-700 dark:text-blue-300">Ürün:</span>
                            <span className="font-semibold text-blue-900 dark:text-blue-100">
                                {recipe.product?.name || '-'}
                            </span>
                        </div>
                        {recipe.product?.code && (
                            <div className="flex justify-between">
                                <span className="text-blue-700 dark:text-blue-300">Ürün Kodu:</span>
                                <span className="font-mono font-semibold text-blue-900 dark:text-blue-100">
                                    {recipe.product.code}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-blue-700 dark:text-blue-300">Versiyon:</span>
                            <span className="font-mono font-semibold text-blue-900 dark:text-blue-100">
                                {recipe.version_code}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-700 dark:text-blue-300">Toplam Malzeme:</span>
                            <span className="font-semibold text-blue-900 dark:text-blue-100">
                                {totalMaterials} adet
                            </span>
                        </div>
                    </div>
                </div>

                {/* Warning Message */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                                Önemli Uyarı
                            </p>
                            <p className="text-xs text-amber-800 dark:text-amber-300">
                                Bu reçeteyi onaylayarak, müşteri kabul etmiştir ve ürünün üretim aşamasına
                                geçmesinin sorumluluğunu üstleniyorsunuz. Onay sonrası reçete değiştirilemez.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {/* Signature ID Input */}
                <div>
                    <Input
                        label="İmza ID"
                        type="password"
                        value={signatureId}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ''); // Only digits
                            if (value.length <= 6) {
                                setSignatureId(value);
                            }
                        }}
                        placeholder="4-6 haneli İmza ID'nizi girin"
                        required
                        autoFocus
                        helperText="Kullanıcı profilinizde görüntülenen benzersiz 4-6 haneli numaranızı girin"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onClose(false)}
                        className="flex-1"
                        disabled={isLoading}
                    >
                        İptal
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                        isLoading={isLoading}
                        disabled={signatureId.length < 4}
                    >
                        ✓ Onaylayıp Üretime Geçir
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
