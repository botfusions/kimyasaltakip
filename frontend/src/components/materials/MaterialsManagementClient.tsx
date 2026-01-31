'use client';

import { useState, useEffect } from 'react';
import { getMaterials, toggleMaterialStatus } from '@/app/actions/materials';
import MaterialModal from './MaterialModal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Material {
    id: string;
    code: string;
    name: string;
    type: string;
    unit: string;
    safety_info: string | null;
    storage_conditions: string | null;
    min_stock: number | null;
    max_stock: number | null;
    is_active: boolean;
    created_at: string;
}

const MATERIAL_TYPES: Record<string, string> = {
    chemical: 'Kimyasal',
    raw_material: 'Ham Madde',
    packaging: 'Ambalaj',
    consumable: 'Sarf Malzeme',
};

export default function MaterialsManagementClient() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [activeFilter, setActiveFilter] = useState<string>('all');

    // Load materials
    useEffect(() => {
        loadMaterials();
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = materials;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (m) =>
                    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    m.code.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter((m) => m.type === typeFilter);
        }

        // Active filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter((m) =>
                activeFilter === 'active' ? m.is_active : !m.is_active
            );
        }

        setFilteredMaterials(filtered);
    }, [searchTerm, typeFilter, activeFilter, materials]);

    const loadMaterials = async () => {
        setIsLoading(true);
        setError('');

        const result = await getMaterials();

        if (result.error) {
            setError(result.error);
        } else {
            setMaterials(result.data || []);
        }

        setIsLoading(false);
    };

    const handleToggleStatus = async (materialId: string) => {
        const result = await toggleMaterialStatus(materialId);

        if (result.error) {
            setError(result.error);
        } else {
            loadMaterials();
        }
    };

    const handleOpenModal = (material?: Material) => {
        setSelectedMaterial(material || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = (updated?: Material) => {
        setIsModalOpen(false);
        setSelectedMaterial(null);

        if (updated) {
            loadMaterials();
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Malzeme Yönetimi
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Kimyasal, ham madde ve yardımcı malzemelerinizi yönetin
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
                        placeholder="Malzeme ara (kod, isim)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Type Filter */}
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                    <option value="all">Tüm Tipler</option>
                    {Object.entries(MATERIAL_TYPES).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>

                {/* Active Filter */}
                <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                </select>

                {/* Add Material Button */}
                <Button variant="primary" onClick={() => handleOpenModal()}>
                    + Yeni Malzeme
                </Button>
            </div>

            {/* Materials Table */}
            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm || typeFilter !== 'all' || activeFilter !== 'all'
                            ? 'Filtreye uygun malzeme bulunamadı'
                            : 'Henüz malzeme eklenmemiş'}
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Kod
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Malzeme Adı
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Tip
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Birim
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Stok Limitleri
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Durum
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {filteredMaterials.map((material) => (
                                    <tr
                                        key={material.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                                                {material.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {material.name}
                                                </p>
                                                {material.safety_info && (
                                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                        ⚠️ Güvenlik bilgisi mevcut
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                                {MATERIAL_TYPES[material.type] || material.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {material.unit}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {material.min_stock !== null || material.max_stock !== null ? (
                                                <span>
                                                    {material.min_stock ?? '-'} / {material.max_stock ?? '-'}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${material.is_active
                                                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                                    }`}
                                            >
                                                {material.is_active ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                            <button
                                                onClick={() => handleOpenModal(material)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                            >
                                                Düzenle
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(material.id)}
                                                className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                                            >
                                                {material.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Material Modal */}
            {isModalOpen && (
                <MaterialModal material={selectedMaterial} onClose={handleCloseModal} />
            )}
        </div>
    );
}
