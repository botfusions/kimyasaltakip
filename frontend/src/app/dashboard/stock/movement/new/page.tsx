import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../actions/auth";
import { getMaterials } from "../../../../actions/materials";
import StockMovementForm from "../../../../../components/stock/StockMovementForm";

export const metadata = {
  title: "Yeni Stok Hareketi | Kimyasal Takip",
  description: "Stok giriş, çıkış veya düzeltme hareketi ekle",
};

export default async function NewStockMovementPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Only admin and warehouse users can create stock movements
  if (!["admin", "warehouse"].includes(currentUser.role)) {
    redirect("/dashboard");
  }

  // Get all active materials for the dropdown
  const materialsResult = await getMaterials();

  if (materialsResult.error || !materialsResult.data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
                <p className="text-sm text-red-700 mt-1">
                  Malzemeler yüklenemedi: {materialsResult.error}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter only active materials
  const activeMaterials = materialsResult.data
    .filter((m) => m.is_active)
    .map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
      unit: m.unit,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <a href="/dashboard" className="hover:text-gray-900">
              Ana Sayfa
            </a>
            <span>/</span>
            <a href="/dashboard/stock" className="hover:text-gray-900">
              Stok Yönetimi
            </a>
            <span>/</span>
            <span className="text-gray-900 font-medium">Yeni Hareket</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Yeni Stok Hareketi
          </h1>
          <p className="mt-2 text-gray-600">
            Stok giriş, çıkış veya düzeltme hareketi oluşturun
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Hareket Detayları
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Tüm zorunlu alanları doldurun ve hareketi kaydedin
            </p>
          </div>

          <div className="p-6">
            <StockMovementForm
              materials={activeMaterials}
              currentUser={currentUser}
            />
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            ❓ Sık Sorulan Sorular
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <details className="group">
              <summary className="cursor-pointer font-medium text-gray-900 hover:text-blue-600">
                Giriş ve Çıkış arasındaki fark nedir?
              </summary>
              <p className="mt-2 pl-4 text-gray-600">
                <strong>Giriş:</strong> Yeni malzeme satın alındığında veya
                depoya girdiğinde kullanılır. Stok miktarını artırır.
                <br />
                <strong>Çıkış:</strong> Malzeme üretimde kullanıldığında,
                satıldığında veya tüketildiğinde kullanılır. Stok miktarını
                azaltır.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-medium text-gray-900 hover:text-blue-600">
                Düzeltme ne zaman kullanılır?
              </summary>
              <p className="mt-2 pl-4 text-gray-600">
                Sayım sonrası fark bulunduğunda veya sistemdeki stok miktarı
                gerçek stok miktarından farklı olduğunda kullanılır. Girdiğiniz
                miktar yeni toplam stok miktarı olacaktır.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-medium text-gray-900 hover:text-blue-600">
                Birim maliyet zorunlu mu?
              </summary>
              <p className="mt-2 pl-4 text-gray-600">
                Hayır, opsiyoneldir. Ancak maliyet takibi ve raporlama için
                önerilir. Özellikle giriş hareketlerinde birim maliyeti girmek,
                ortalama maliyet hesaplamalarına yardımcı olur.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-medium text-gray-900 hover:text-blue-600">
                Parti numarası nedir?
              </summary>
              <p className="mt-2 pl-4 text-gray-600">
                Tedarikçiden gelen malzemelerin lot/batch numarasıdır. Kalite
                kontrolü ve izlenebilirlik için önemlidir. Opsiyoneldir ancak
                özellikle kimyasal maddelerde önerilir.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
