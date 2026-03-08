import { getCurrentUser } from "../../actions/auth";
import { redirect } from "next/navigation";

export default async function ProductionPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Üretim Takibi
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Üretim iş emirlerini ve durumlarını buradan takip edebilirsiniz.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Geliştirme Aşamasında
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Üretim modülü şu anda geliştirilme aşamasındadır. Çok yakında
          hizmetinizde olacak.
        </p>
      </div>
    </div>
  );
}
