import { Suspense } from 'react';
import { getUsers } from '@/app/actions/users';
import UserManagementClient from '@/components/users/UserManagementClient';

export default async function UsersPage() {
    // Fetch initial users data
    const result = await getUsers();

    if (result.error) {
        return (
            <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Hata Oluştu
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{result.error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Kullanıcı Yönetimi
                    </h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Sistem kullanıcılarını görüntüle ve yönet
                    </p>
                </div>
            </div>

            {/* Client Component for Interactive Features */}
            <Suspense fallback={<div>Yükleniyor...</div>}>
                <UserManagementClient initialUsers={result.data || []} />
            </Suspense>
        </div>
    );
}
