import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import InvoiceImportClient from '@/components/invoices/InvoiceImportClient';

export default async function InvoiceImportPage() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/login');
    }

    if (!['admin', 'warehouse'].includes(currentUser.role)) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">
                        Bu sayfaya erişim yetkiniz yok. Sadece admin ve depo kullanıcıları fatura içe aktarabilir.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Fatura İçe Aktarma</h1>
                <p className="mt-1 text-sm text-gray-600">
                    E-Fatura XML dosyasını yükleyerek otomatik stok girişi yapın
                </p>
            </div>

            <InvoiceImportClient currentUser={currentUser} />
        </div>
    );
}
