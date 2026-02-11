
import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';

export default async function ReportsPage() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/login');
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Raporlar</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Sistem raporlarını ve analizlerini buradan görüntüleyebilirsiniz.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Geliştirme Aşamasında</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Raporlama modülü şu anda geliştirilme aşamasındadır. Çok yakında hizmetinizde olacak.
                </p>
            </div>
        </div>
    );
}
