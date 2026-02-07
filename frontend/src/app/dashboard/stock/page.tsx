import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { getAllStock, getCriticalStock, getStockStats } from '@/app/actions/stock';
import StockManagementClient from '@/components/stock/StockManagementClient';

export default async function StockPage() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/login');
    }

    // Fetch stock data
    const [stockResult, criticalStockResult, statsResult] = await Promise.all([
        getAllStock(),
        getCriticalStock(),
        getStockStats(),
    ]);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Stok Yönetimi</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Malzeme stok durumunu görüntüleyin ve yönetin
                </p>
            </div>

            <StockManagementClient
                initialStocks={stockResult.data || []}
                criticalStocks={criticalStockResult.data || []}
                stats={statsResult.data}
                currentUser={currentUser}
            />
        </div>
    );
}
