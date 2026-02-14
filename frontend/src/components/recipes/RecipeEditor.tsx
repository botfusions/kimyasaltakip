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
    const [orderCode, setOrderCode] = useState(''); // Reçete İş Emri No
    const [colorCode, setColorCode] = useState(''); // Renk No
    const [processInfo, setProcessInfo] = useState(''); // Proses
    const [totalWeight, setTotalWeight] = useState(''); // Toplam Kg
    const [machineCode, setMachineCode] = useState(''); // Kazan Kodu

    const [planningDate] = useState(new Date().toISOString().slice(0, 10)); // Planlama Tarihi - otomatik bugünün tarihi
    const [colorName, setColorName] = useState(''); // Renk
    const [orderDate, setOrderDate] = useState(''); // İş Emri Tarihi
    const [bathVolume, setBathVolume] = useState(''); // Banyo Miktar
    const [batchRatio, setBatchRatio] = useState(''); // Banyo Oranı

    // Order Details Table Fields
    const [sipNo, setSipNo] = useState(''); // Sip. No
    const [customerRefNo, setCustomerRefNo] = useState(''); // Ref. No
    const [customerName, setCustomerName] = useState(''); // Müşteri
    const [customerSipMt, setCustomerSipMt] = useState(''); // Sip Mt
    const [customerOrderNo, setCustomerOrderNo] = useState(''); // M. Sip No
    const [yarnType, setYarnType] = useState(''); // İplik
    const [cCozg, setCCozg] = useState(''); // C/Çözg
    const [lotNo, setLotNo] = useState(''); // Lot No
    const [brandName, setBrandName] = useState(''); // Marka

    const [recipeNameNo, setRecipeNameNo] = useState(''); // Kept if needed or map to orderCode
    const [startDate, setStartDate] = useState('');
    const [finishDate, setFinishDate] = useState('');
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
            setYarnType(result.data.yarn_type || result.data.yarn_code || '');
            // planningDate is always auto-set to today's date
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
            quantity: '10',
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
        // if (!selectedProductId) {
        //     setError('Lütfen bir ürün seçin');
        //     setIsLoading(false);
        //     return;
        // }

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
        if (selectedProductId) formData.append('product_id', selectedProductId); // Optional now
        formData.append('version_code', versionCode);
        formData.append('notes', notes);
        formData.append('items', JSON.stringify(validItems));

        // Add new fields
        if (orderCode) formData.append('order_code', orderCode);
        if (colorCode) formData.append('color_code', colorCode);
        if (processInfo) formData.append('process_info', processInfo);
        if (totalWeight) formData.append('total_weight', totalWeight);
        if (machineCode) formData.append('machine_code', machineCode);

        if (planningDate) formData.append('planning_date', planningDate);
        if (colorName) formData.append('color_name', colorName);
        if (orderDate) formData.append('work_order_date', orderDate);
        if (bathVolume) formData.append('bath_volume', bathVolume);
        if (batchRatio) formData.append('batch_ratio', batchRatio);

        if (sipNo) formData.append('sip_no', sipNo);
        if (customerRefNo) formData.append('customer_ref_no', customerRefNo);
        if (customerName) formData.append('customer_name', customerName);
        if (customerSipMt) formData.append('customer_sip_mt', customerSipMt);
        if (customerOrderNo) formData.append('customer_order_no', customerOrderNo);
        if (yarnType) formData.append('yarn_type', yarnType);
        if (cCozg) formData.append('c_cozg', cCozg);
        if (lotNo) formData.append('lot_no', lotNo);
        if (brandName) formData.append('brand_name', brandName);

        if (recipeNameNo) formData.append('recipe_name_no', recipeNameNo);
        if (startDate) formData.append('start_date', startDate);
        if (finishDate) formData.append('finish_date', finishDate);
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
                {/* Reçete Bilgileri (Top Section) */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b pb-2">
                        Reçete Bilgileri
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <Input
                                label="Reçete İş Emri No"
                                value={orderCode}
                                onChange={(e) => setOrderCode(e.target.value)}
                                placeholder="Örn: 94275"
                                required
                            />
                            <Input
                                label="Renk No"
                                value={colorCode}
                                onChange={(e) => setColorCode(e.target.value)}
                                placeholder="Örn: BNXKB045521"
                            />
                            <Input
                                label="Proses"
                                value={processInfo}
                                onChange={(e) => setProcessInfo(e.target.value)}
                                placeholder="Örn: 60 C AÇIK YIK. PROG. 5"
                            />
                            <Input
                                label="Toplam Kg"
                                type="number"
                                value={totalWeight}
                                onChange={(e) => setTotalWeight(e.target.value)}
                                placeholder="1.602,24"
                            />
                            <Input
                                label="Kazan Kodu"
                                value={machineCode}
                                onChange={(e) => setMachineCode(e.target.value)}
                                placeholder="250/2 L.Bellini"
                            />
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            <Input
                                label="Planlama Tarihi"
                                type="date"
                                value={planningDate}
                                readOnly
                                disabled
                                className="bg-gray-100 cursor-not-allowed"
                            />
                            <Input
                                label="Renk Adı"
                                value={colorName}
                                onChange={(e) => setColorName(e.target.value)}
                                placeholder="Örn: BEJ"
                            />
                            <Input
                                label="İş Emri Tarihi"
                                type="date"
                                value={orderDate}
                                onChange={(e) => setOrderDate(e.target.value)}
                            />
                            <Input
                                label="Banyo Miktar"
                                type="number"
                                value={bathVolume}
                                onChange={(e) => setBathVolume(e.target.value)}
                                placeholder="*"
                            />
                            <Input
                                label="Banyo Oranı"
                                value={batchRatio}
                                onChange={(e) => setBatchRatio(e.target.value)}
                                placeholder="9,2"
                            />
                        </div>
                    </div>
                </div>

                {/* Sipariş Detayları (Middle Section) */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b pb-2">
                        Sipariş Detayları
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input
                            label="Sip. No"
                            value={sipNo}
                            onChange={(e) => setSipNo(e.target.value)}
                            placeholder="TTL14344BS-1"
                        />
                        <Input
                            label="Ref. No"
                            value={customerRefNo}
                            onChange={(e) => setCustomerRefNo(e.target.value)}
                            placeholder="146882"
                        />
                        <Input
                            label="Müşteri"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="RATEKS TEKSTİL"
                        />
                        <Input
                            label="Sip Mt"
                            value={customerSipMt}
                            onChange={(e) => setCustomerSipMt(e.target.value)}
                            placeholder="001672"
                        />
                        <Input
                            label="M. Sip No"
                            value={customerOrderNo}
                            onChange={(e) => setCustomerOrderNo(e.target.value)}
                            placeholder="001672/001672"
                        />
                        <Input
                            label="İplik"
                            value={yarnType}
                            onChange={(e) => setYarnType(e.target.value)}
                            placeholder="16/1 RING %100 PAMUK"
                        />
                        <Input
                            label="C/Çözg"
                            value={cCozg}
                            onChange={(e) => setCCozg(e.target.value)}
                            placeholder="C/Çözg"
                        />
                        <Input
                            label="Lot No"
                            value={lotNo}
                            onChange={(e) => setLotNo(e.target.value)}
                            placeholder="1704"
                        />
                        <Input
                            label="Marka"
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            placeholder="Marka"
                        />
                    </div>

                    {/* Extra fields below Sipariş Detayları */}
                    <div className="border-t pt-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            Stok Kodu
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
                                                    type="text"
                                                    value={item.material_code || ''}
                                                    readOnly
                                                    className="w-32 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
                                                    placeholder="-"
                                                />
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
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                                            {totalQuantity.toFixed(2)} {selectedProductId ? products.find(p => p.id === selectedProductId)?.unit || '' : ''}
                                        </td>
                                        <td className="px-4 py-3"></td>
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
                                        <td colSpan={2}></td>
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
