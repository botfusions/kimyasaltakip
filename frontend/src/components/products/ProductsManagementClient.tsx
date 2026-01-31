'use client';

import { useState, useEffect } from 'react';
import { getProducts, toggleProductStatus } from '@/app/actions/products';
import ProductModal from './ProductModal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
    created_at: string;
}

const PRODUCT_TYPES: Record<string, string> = {
    cleaning: 'Temizlik Ürünü',
    cosmetic: 'Kozmetik',
    industrial: 'Endüstriyel Kimyasal',
    other: 'Diğer',
};

export default function ProductsManagementClient() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [activeFilter, setActiveFilter] = useState<string>('all');

    // Load products
    useEffect(() => {
        loadProducts();
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = products;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (p) =>
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.code.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter((p) => p.type === typeFilter);
        }

        // Active filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter((p) =>
                activeFilter === 'active' ? p.is_active : !p.is_active
            );
        }

        setFilteredProducts(filtered);
    }, [searchTerm, typeFilter, activeFilter, products]);

    const loadProducts = async () => {
        setIsLoading(true);
        setError('');

        const result = await getProducts();

        if (result.error) {
            setError(result.error);
        } else {
            setProducts(result.data || []);
        }

        setIsLoading(false);
    };

    const handleToggleStatus = async (productId: string) => {
        const result = await toggleProductStatus(productId);

        if (result.error) {
            setError(result.error);
        } else {
            loadProducts();
        }
    };

    const handleOpenModal = (product?: Product) => {
        setSelectedProduct(product || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = (updated?: Product) => {
        setIsModalOpen(false);
        setSelectedProduct(null);

        if (updated) {
            loadProducts();
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Ürün Yönetimi
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Üretilen ürünlerinizi yönetin
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
                        placeholder="Ürün ara (kod, isim)..."
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
                    {Object.entries(PRODUCT_TYPES).map(([value, label]) => (
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

                {/* Add Product Button */}
                <Button variant="primary" onClick={() => handleOpenModal()}>
                    + Yeni Ürün
                </Button>
            </div>

            {/* Products Table */}
            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm || typeFilter !== 'all' || activeFilter !== 'all'
                            ? 'Filtreye uygun ürün bulunamadı'
                            : 'Henüz ürün eklenmemiş'}
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
                                        Ürün Adı
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Tip
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Birim
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Hedef pH
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Raf Ömrü
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
                                {filteredProducts.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                                                {product.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {product.name}
                                                </p>
                                                {product.description && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {product.description}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                                {PRODUCT_TYPES[product.type] || product.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {product.unit}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {product.target_ph || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {product.shelf_life_days ? `${product.shelf_life_days} gün` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.is_active
                                                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                                    }`}
                                            >
                                                {product.is_active ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                            <button
                                                onClick={() => handleOpenModal(product)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                            >
                                                Düzenle
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(product.id)}
                                                className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                                            >
                                                {product.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {isModalOpen && (
                <ProductModal product={selectedProduct} onClose={handleCloseModal} />
            )}
        </div>
    );
}
