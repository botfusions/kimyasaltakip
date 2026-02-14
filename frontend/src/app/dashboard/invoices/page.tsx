import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { getInvoiceHistory } from '@/app/actions/invoices';
import InvoiceListClient from '@/components/invoices/InvoiceListClient';

export const metadata = {
    title: 'Fatura Yönetimi | Kimyasal Takip',
    description: 'İçe aktarılan faturaları görüntüle ve yönet',
};

export default async function InvoicesPage() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/login');
    }

    // Get invoice history
    const { data: invoices, error } = await getInvoiceHistory(100);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Fatura Yönetimi</h1>
                            <p className="mt-2 text-gray-600">İçe aktarılan faturaları görüntüleyin ve yönetin</p>
                        </div>
                        <a
                            href="/dashboard/invoices/import"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Fatura İçe Aktar
                        </a>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <svg
                                className="w-5 h-5 text-red-600 mr-2 mt-0.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Hata</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Invoice List */}
                <InvoiceListClient invoices={(invoices || []) as any[]} currentUser={currentUser} />
            </div>
        </div>
    );
}
