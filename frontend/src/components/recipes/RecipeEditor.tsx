'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createRecipe, updateRecipe, getRecipeById } from '@/app/actions/recipes';
import { getMaterials } from '@/app/actions/materials';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// Birim seçenekleri
const UNIT_OPTIONS = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'mg', label: 'Miligram (mg)' },
    { value: 'L', label: 'Litre (L)' },
    { value: 'mL', label: 'Mililitre (mL)' },
    { value: 'adet', label: 'Adet' },
];

interface RecipeItem {
    id?: string;
    material_id: string;
    material_name?: string;
    material_code?: string;
    unit: string; // User-selected unit
    quantity: string;
    percentage: string; // User-entered percentage
    notes: string;
}

interface Material {
    id: string;
    code: string;
    name: string;
    unit: string;
    is_active: boolean;
}

interface Product {
    id: string;
    code: string;
    name: string;
    unit: string;
}

interface Props {
    products: Product[];
    recipeId?: string; // If editing
}

export default function RecipeEditor({ products, recipeId }: Props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Form fields
    const [selectedProductId, setSelectedProductId] = useState('');
    const [versionCode, setVersionCode] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<RecipeItem[]>([]);

    // New PDF form fields
    const [recipeNameNo, setRecipeNameNo] = useState('');
    const [colorCode, setColorCode] = useState('');
    const [yarnCode, setYarnCode] = useState('');
    const [planningDate, setPlanningDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [finishDate, setFinishDate] = useState('');
    const [batchRatio, setBatchRatio] = useState('');
    const [processWashCount, setProcessWashCount] = useState('');
    const [cauldronQuantity, setCauldronQuantity] = useState('');

    // Materials for selection
    const [materials, setMaterials] = useState<Material[]>([]);

    // Load materials and recipe (if editing)
    useEffect(() => {
        loadMaterials();
        if (recipeId) {
            loadRecipe();
        } else {
            // Add one empty item for new recipes
            addItem();
        }
    }, [recipeId]);

    const loadMaterials = async () => {
        const result = await getMaterials();
        if (result.data) {
            setMaterials(result.data.filter((m) => m.is_active));
        }
    };

    const loadRecipe = async () => {
        if (!recipeId) return;

        const result = await getRecipeById(recipeId);
        if (result.error) {
            setError(result.error);
        } else if (result.data) {
            setVersionCode(result.data.version_code);
            setNotes(result.data.notes || '');
            setSelectedProductId(result.data.product_id); // Set the product when editing

            // Load new fields
            setRecipeNameNo(result.data.recipe_name_no || '');
            setColorCode(result.data.color_code || '');
            setYarnCode(result.data.yarn_code || '');
            setPlanningDate(result.data.planning_date || '');
            setStartDate(result.data.start_date || '');
            setFinishDate(result.data.finish_date || '');
            setBatchRatio(result.data.batch_ratio ? String(result.data.batch_ratio) : '');
            setProcessWashCount(result.data.process_wash_count ? String(result.data.process_wash_count) : '');
            setCauldronQuantity(result.data.cauldron_quantity ? String(result.data.cauldron_quantity) : '');

            const loadedItems = result.data.recipe_items.map((item: any) => ({
                id: item.id,
                material_id: item.material_id,
                material_name: item.material.name,
                material_code: item.material.code,
                unit: item.unit || item.material.unit || 'kg', // Prefer stored unit, then material default, then kg
                quantity: String(item.quantity),
                percentage: String(item.percentage),
                notes: item.notes || '',
            }));

            setItems(loadedItems);
        }
    };

    const addItem = () => {
        const newItem: RecipeItem = {
            material_id: '',
            material_name: '',
            material_code: '',
            unit: 'kg', // Default unit
            quantity: '',
            percentage: '',
            notes: '',
        };

        setItems([...items, newItem]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof RecipeItem, value: string) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        setItems(updated);
    };

    const handleMaterialChange = (index: number, materialId: string) => {
        const material = materials.find((m) => m.id === materialId);

        const updated = [...items];
        updated[index] = {
            ...updated[index],
            material_id: materialId,
            material_name: material?.name,
            material_code: material?.code,
            unit: material?.unit || 'kg', // Auto-set unit when material changes
        };
        setItems(updated);
    };

    const totalQuantity = items.reduce((sum, item) => {
        return sum + (parseFloat(item.quantity) || 0);
    }, 0);

    const totalPercentage = items.reduce((sum, item) => {
        return sum + (parseFloat(item.percentage) || 0);
    }, 0);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Validation
        if (!selectedProductId) {
            setError('Lütfen bir ürün seçin');
            setIsLoading(false);
            return;
        }

        if (!versionCode) {
            setError('Versiyon kodu gereklidir');
            setIsLoading(false);
            return;
        }

        const validItems = items.filter(
            (item) => item.material_id && parseFloat(item.quantity) > 0
        );

        if (validItems.length === 0) {
            setError('En az bir malzeme eklemelisiniz');
            setIsLoading(false);
            return;
        }

        // Check percentage total (should be close to 100)
        // Removed strict check as per user preference in some contexts, but kept warning logic in UI
        /*
        if (Math.abs(totalPercentage - 100) > 0.5) {
            setError(`Toplam yüzde ${totalPercentage.toFixed(2)}% - 100% olmalıdır`);
            setIsLoading(false);
            return;
        }
        */

        const formData = new FormData();
        formData.append('product_id', selectedProductId);
        formData.append('version_code', versionCode);
        formData.append('notes', notes);
        formData.append('items', JSON.stringify(validItems));

        // Add new fields
        if (recipeNameNo) formData.append('recipe_name_no', recipeNameNo);
        if (colorCode) formData.append('color_code', colorCode);
        if (yarnCode) formData.append('yarn_code', yarnCode);
        if (planningDate) formData.append('planning_date', planningDate);
        if (startDate) formData.append('start_date', startDate);
        if (finishDate) formData.append('finish_date', finishDate);
        if (batchRatio) formData.append('batch_ratio', batchRatio);
        if (processWashCount) formData.append('process_wash_count', processWashCount);
        if (cauldronQuantity) formData.append('cauldron_quantity', cauldronQuantity);

        try {
            const result = recipeId
                ? await updateRecipe(recipeId, formData)
                : await createRecipe(formData);

            if (result.error) {
                setError(result.error);
            } else {
                router.push('/dashboard/recipes');
            }
        } catch (err) {
            setError('Beklenmeyen bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="secondary"
                    onClick={() => router.push('/dashboard/recipes')}
                    className="mb-4"
                >
                    ← Geri Dön
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {recipeId ? 'Reçete Düzenle' : 'Yeni Reçete Oluştur'}
                </h1>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Temel Bilgiler
                    </h2>

                    {/* Product Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Ürün Seçimi *
                        </label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                        >
                            <option value="">Lütfen bir ürün seçin...</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name} ({product.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Versiyon Kodu"
                            value={versionCode}
                            onChange={(e) => setVersionCode(e.target.value)}
                            placeholder="Örn: V1.0, REV-001"
                            required
                        />
                        <Input
                            label="Reçete Adı/No"
                            value={recipeNameNo}
                            onChange={(e) => setRecipeNameNo(e.target.value)}
                            placeholder="Reçete adı veya numarası"
                        />
                        <Input
                            label="Renk Kodu"
                            value={colorCode}
                            onChange={(e) => setColorCode(e.target.value)}
                            placeholder="Örn: RAL 5010"
                        />
                        <Input
                            label="İplik Kodu"
                            value={yarnCode}
                            onChange={(e) => setYarnCode(e.target.value)}
                            placeholder="İplik kodu"
                        />
                        <Input
                            label="Planlama Tarihi"
                            type="date"
                            value={planningDate}
                            onChange={(e) => setPlanningDate(e.target.value)}
                        />
                        <Input
                            label="Başlangıç Tarihi"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Input
                            label="Bitiş Tarihi"
                            type="date"
                            value={finishDate}
                            onChange={(e) => setFinishDate(e.target.value)}
                        />
                        <Input
                            label="Parti Oranı (1:n)"
                            type="number"
                            step="0.01"
                            value={batchRatio}
                            onChange={(e) => setBatchRatio(e.target.value)}
                            placeholder="Örn: 100"
                        />
                        <Input
                            label="Proses Yıkama Sayısı"
                            type="number"
                            value={processWashCount}
                            onChange={(e) => setProcessWashCount(e.target.value)}
                            placeholder="Örn: 2"
                        />
                        <Input
                            label="Reçete Kazan Miktarı (kg)"
                            type="number"
                            step="0.01"
                            value={cauldronQuantity}
                            onChange={(e) => setCauldronQuantity(e.target.value)}
                            placeholder="Örn: 150.5"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notlar
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Reçete ile ilgili özel notlar..."
                        />
                    </div>
                </div>

                {/* Materials */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Malzemeler
                        </h2>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={addItem}
                            size="sm"
                        >
                            + Yeni Satır Ekle
                        </Button>
                    </div>

                    {/* Items Table */}
                    {items.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            Henüz malzeme eklenmedi. "Yeni Satır Ekle" butonunu kullanarak malzeme ekleyebilirsiniz.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase w-1/3">
                                            Malzeme
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                                            Miktar
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                                            Birim
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                                            Yüzde (%)
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                                            Notlar
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                                            İşlem
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={item.material_id}
                                                    onChange={(e) => handleMaterialChange(index, e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                >
                                                    <option value="">Malzeme Seçiniz...</option>
                                                    {materials.map((m) => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.code} - {m.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        updateItem(index, 'quantity', e.target.value)
                                                    }
                                                    className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={item.unit}
                                                    onChange={(e) =>
                                                        updateItem(index, 'unit', e.target.value)
                                                    }
                                                    className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                >
                                                    {UNIT_OPTIONS.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.value}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.percentage}
                                                    onChange={(e) =>
                                                        updateItem(index, 'percentage', e.target.value)
                                                    }
                                                    className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                    placeholder="%"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={item.notes}
                                                    onChange={(e) =>
                                                        updateItem(index, 'notes', e.target.value)
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                    placeholder="Not..."
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                                                >
                                                    Sil
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-300 dark:border-gray-600">
                                    <tr>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                                            TOPLAM
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                                            {totalQuantity.toFixed(2)} {selectedProductId ? products.find(p => p.id === selectedProductId)?.unit || '' : ''}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`text-sm font-bold ${Math.abs(totalPercentage - 100) < 0.5
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-600 dark:text-red-400'
                                                    }`}
                                            >
                                                {totalPercentage.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td colSpan={3}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.push('/dashboard/recipes')}
                        disabled={isLoading}
                        className="flex-1"
                    >
                        İptal
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isLoading}
                        className="flex-1"
                    >
                        {recipeId ? 'Güncelle' : 'Oluştur'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
