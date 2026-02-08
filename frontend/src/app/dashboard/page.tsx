import { getCriticalStock, getStockStats } from '@/app/actions/stock';

export default async function DashboardPage() {
    // Fetch real-time data
    const statsResult = await getStockStats();
    const criticalResult = await getCriticalStock();

    const stats = statsResult.data;
    const criticalStock = criticalResult.data;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Gösterge Paneli</h1>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Toplam Malzeme</h2>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalMaterials}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Aktif malzeme sayısı</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Kritik Stok</h2>
                    <p className="text-3xl font-bold text-red-500 dark:text-red-400">{stats.criticalStockCount}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Minimum seviyenin altında</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Toplam Stok</h2>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalStockQuantity}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Toplam miktar (kg/L)</p>
                </div>
            </div>

            {/* Kritik Stok Listesi */}
            {criticalStock.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded shadow p-4 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">⚠️ Kritik Stok Uyarıları</h2>
                    <div className="space-y-2">
                        {criticalStock.map((item: any) => (
                            <div
                                key={item.stock_id}
                                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"
                            >
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{item.material_name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Kod: {item.material_code}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                        {item.current_quantity} {item.unit}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Min: {item.critical_level} {item.unit}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {criticalStock.length === 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4 text-center">
                    <p className="text-green-700 dark:text-green-400 font-medium">✅ Tüm stoklar yeterli seviyede</p>
                </div>
            )}
        </div>
    )
}

