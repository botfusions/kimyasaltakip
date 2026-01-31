'use client';

import { useState, FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createProduct, updateProduct } from '@/app/actions/products';

interface Product {
    id: string;
    code: string;
    name: string;
    type: string;
    unit: string;
    description: string | null;
    target_ph: string | null;
    target_density: number | null;
    shelf_life_days: number | null;
    is_active: boolean;
}

interface Props {
    product: Product | null;
    onClose: (updatedProduct?: Product) => void;
}

const PRODUCT_TYPES = [
    { value: 'cleaning', label: 'Temizlik Ürünü' },
    { value: 'cosmetic', label: 'Kozmetik' },
    { value: 'industrial', label: 'Endüstriyel Kimyasal' },
    { value: 'other', label: 'Diğer' },
];

const UNITS = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'l', label: 'Litre (L)' },
    { value: 'pcs', label: 'Adet' },
];

export default function ProductModal({ product, onClose }: Props) {
    const isEditing = !!product;

    const [formData, setFormData] = useState({
        code: product?.code || '',
        name: product?.name || '',
        type: product?.type || 'cleaning',
        unit: product?.unit || 'l',
        description: product?.description || '',
        target_ph: product?.target_ph || '',
        target_density: product?.target_density?.toString() || '',
        shelf_life_days: product?.shelf_life_days?.toString() || '',
        is_active: product?.is_active ?? true,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const formDataObj = new FormData();
            formDataObj.append('code', formData.code);
            formDataObj.append('name', formData.name);
            formDataObj.append('type', formData.type);
            formDataObj.append('unit', formData.unit);
            formDataObj.append('description', formData.description);
            formDataObj.append('target_ph', formData.target_ph);
            formDataObj.append('target_density', formData.target_density);
            formDataObj.append('shelf_life_days', formData.shelf_life_days);
            formDataObj.append('is_active', formData.is_active.toString());

            const result = isEditing
                ? await updateProduct(product.id, formDataObj)
                : await createProduct(formDataObj);

            if (result.error) {
                setError(result.error);
            } else {
                onClose(result.data);
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
            onClose={() => onClose()}
            title={isEditing ? 'Ürün Düzenle' : 'Yeni Ürün'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {/* Code and Name Row */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Ürün Kodu"
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="örn. PRD-001"
                        required
                        helperText="Benzersiz ürün kodu"
                    />

                    <Input
                        label="Ürün Adı"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="örn. Çamaşır Deterjanı"
                        required
                    />
                </div>

                {/* Type and Unit Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Ürün Tipi <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            required
                        >
                            {PRODUCT_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Birim <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            required
                        >
                            {UNITS.map((unit) => (
                                <option key={unit.value} value={unit.value}>
                                    {unit.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Açıklama
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Ürün hakkında kısa açıklama"
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                    />
                </div>

                {/* Target Specifications Row */}
                <div className="grid grid-cols-3 gap-4">
                    <Input
                        label="Hedef pH"
                        type="text"
                        value={formData.target_ph}
                        onChange={(e) => setFormData({ ...formData, target_ph: e.target.value })}
                        placeholder="örn. 7.0-7.5"
                        helperText="pH aralığı"
                    />

                    <Input
                        label="Hedef Yoğunluk"
                        type="number"
                        step="0.001"
                        value={formData.target_density}
                        onChange={(e) => setFormData({ ...formData, target_density: e.target.value })}
                        placeholder="örn. 1.05"
                        helperText="g/ml"
                    />

                    <Input
                        label="Raf Ömrü (Gün)"
                        type="number"
                        value={formData.shelf_life_days}
                        onChange={(e) => setFormData({ ...formData, shelf_life_days: e.target.value })}
                        placeholder="örn. 365"
                        helperText="Gün cinsinden"
                    />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Aktif Ürün
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onClose()}
                        className="flex-1"
                        disabled={isLoading}
                    >
                        İptal
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        className="flex-1"
                        isLoading={isLoading}
                    >
                        {isEditing ? 'Güncelle' : 'Oluştur'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
