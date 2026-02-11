'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Material {
    id: string;
    code: string;
    name: string;
    unit: string;
    category: string;
    critical_level: number;
    is_active: boolean;
}

interface Stock {
    id: string;
    material_id: string;
    quantity: number;
    reserved_quantity: number;
    last_movement_at: string;
    location: string;
    material: Material;
}

interface StockManagementClientProps {
    initialStocks: Stock[];
    criticalStocks: any[];
    stats: {
        totalMaterials: number;
        criticalStockCount: number;
        totalStockQuantity: number;
    };
    currentUser: any;
}

export default function StockManagementClient({
    initialStocks,
    criticalStocks,
    stats,
    currentUser,
}: StockManagementClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    // Filter stocks
    const filteredStocks = initialStocks.filter((stock) => {
        const matchesSearch =
            !searchQuery ||
            stock.material?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stock.material?.code?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesLowStock =
            !showLowStockOnly || stock.quantity <= (stock.material?.critical_level || 0);

        return matchesSearch && matchesLowStock;
    });

    // Get stock status
    const getStockStatus = (quantity: number, criticalLevel: number) => {
        if (quantity === 0) return { label: 'Tükendi', color: 'text-red-600 bg-red-50' };
        if (quantity <= criticalLevel) return { label: 'Kritik', color: 'text-orange-600 bg-orange-50' };
        return { label: 'Normal', color: 'text-green-600 bg-green-50' };
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Malzeme</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.totalMaterials}</div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Kritik Stok</div>
                    <div className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-500">{stats.criticalStockCount}</div>
                    {stats.criticalStockCount > 0 && (
                        <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">Dikkat gerekiyor!</div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Stok Miktarı</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.totalStockQuantity.toLocaleString('tr-TR')}
                    </div>
                </div>
            </div>

            {/* Critical Stock Warning */}
            {criticalStocks.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="flex items-center">
                        <svg
                            className="w-5 h-5 text-orange-600 dark:text-orange-500 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <div>
                            <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                {criticalStocks.length} malzeme kritik stok seviyesinde
                            </h3>
                            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                                Lütfen stok girişi yapınız
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex-1 w-full sm:max-w-md">
                    <Input
                        type="text"
                        placeholder="Malzeme ara (isim veya kod)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                            type="checkbox"
                            checked={showLowStockOnly}
                            onChange={(e) => setShowLowStockOnly(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Sadece düşük stok
                    </label>

                    {['admin', 'warehouse'].includes(currentUser.role) && (
                        <Button
                            onClick={() => router.push('/dashboard/stock/movement/new')}
                            variant="primary"
                        >
                            + Stok Hareketi Ekle
                        </Button>
                    )}
                </div>
            </div>

            {/* Stock Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Kod
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Malzeme Adı
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Kategori
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Mevcut Stok
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Kritik Seviye
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Durum
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Konum
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredStocks.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                                    >
                                        {searchQuery || showLowStockOnly
                                            ? 'Filtreye uygun stok bulunamadı'
                                            : 'Henüz stok kaydı yok'}
                                    </td>
                                </tr>
                            ) : (
                                filteredStocks.map((stock) => {
                                    const status = getStockStatus(
                                        stock.quantity,
                                        stock.material?.critical_level || 0
                                    );
                                    return (
                                        <tr
                                            key={stock.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b last:border-0 border-gray-200 dark:border-gray-700"
                                            onClick={() =>
                                                router.push(`/dashboard/stock/${stock.material_id}`)
                                            }
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                {stock.material?.code}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                                {stock.material?.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {stock.material?.category || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                                                {stock.quantity.toLocaleString('tr-TR')}{' '}
                                                {stock.material?.unit}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                                                {stock.material?.critical_level?.toLocaleString('tr-TR')}{' '}
                                                {stock.material?.unit}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}
                                                >
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {stock.location || '-'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Results Count */}
            {filteredStocks.length > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Toplam {filteredStocks.length} malzeme gösteriliyor
                </div>
            )}
        </div>
    );
}
