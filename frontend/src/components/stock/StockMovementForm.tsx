"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";
import { addStockMovement } from "../../app/actions/stock";

interface StockMovementFormProps {
  materials: Array<{
    id: string;
    code: string;
    name: string;
    unit: string;
  }>;
  currentUser: any;
}

export default function StockMovementForm({
  materials,
  currentUser,
}: StockMovementFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [movementType, setMovementType] = useState<"in" | "out" | "adjustment">(
    "in",
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await addStockMovement(formData);

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard/stock");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Beklenmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Malzeme Seçimi */}
      <div>
        <label
          htmlFor="material_id"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Malzeme <span className="text-red-500">*</span>
        </label>
        <select
          id="material_id"
          name="material_id"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Malzeme seçin...</option>
          {materials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.code} - {material.name} ({material.unit})
            </option>
          ))}
        </select>
      </div>

      {/* Hareket Tipi */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hareket Tipi <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-4">
          <label
            className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              movementType === "in"
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="radio"
              name="movement_type"
              value="in"
              checked={movementType === "in"}
              onChange={(e) => setMovementType(e.target.value as "in")}
              className="sr-only"
            />
            <div className="text-center">
              <div className="text-2xl mb-1">📥</div>
              <div className="font-medium text-gray-900">Giriş</div>
              <div className="text-xs text-gray-500">Stok Artışı</div>
            </div>
          </label>

          <label
            className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              movementType === "out"
                ? "border-red-500 bg-red-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="radio"
              name="movement_type"
              value="out"
              checked={movementType === "out"}
              onChange={(e) => setMovementType(e.target.value as "out")}
              className="sr-only"
            />
            <div className="text-center">
              <div className="text-2xl mb-1">📤</div>
              <div className="font-medium text-gray-900">Çıkış</div>
              <div className="text-xs text-gray-500">Stok Azalışı</div>
            </div>
          </label>

          <label
            className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              movementType === "adjustment"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="radio"
              name="movement_type"
              value="adjustment"
              checked={movementType === "adjustment"}
              onChange={(e) => setMovementType(e.target.value as "adjustment")}
              className="sr-only"
            />
            <div className="text-center">
              <div className="text-2xl mb-1">⚖️</div>
              <div className="font-medium text-gray-900">Düzeltme</div>
              <div className="text-xs text-gray-500">Sayım/Düzeltme</div>
            </div>
          </label>
        </div>
      </div>

      {/* Miktar */}
      <div>
        <label
          htmlFor="quantity"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Miktar <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="quantity"
          name="quantity"
          step="0.01"
          min="0.01"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Örn: 100"
        />
        <p className="mt-1 text-sm text-gray-500">
          {movementType === "out"
            ? "Çıkış miktarı (pozitif sayı girin)"
            : movementType === "adjustment"
              ? "Yeni toplam stok miktarı"
              : "Giriş miktarı"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Birim Maliyet */}
        <div>
          <label
            htmlFor="unit_cost"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Birim Maliyet (TRY)
          </label>
          <input
            type="number"
            id="unit_cost"
            name="unit_cost"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Örn: 45.50"
          />
          <p className="mt-1 text-sm text-gray-500">Opsiyonel</p>
        </div>

        {/* Parti Numarası */}
        <div>
          <label
            htmlFor="batch_number"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Parti/Lot Numarası
          </label>
          <input
            type="text"
            id="batch_number"
            name="batch_number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Örn: LOT-2024-001"
          />
          <p className="mt-1 text-sm text-gray-500">Opsiyonel</p>
        </div>
      </div>

      {/* Tedarikçi */}
      {movementType === "in" && (
        <div>
          <label
            htmlFor="supplier"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Tedarikçi
          </label>
          <input
            type="text"
            id="supplier"
            name="supplier"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Örn: ABC Kimya A.Ş."
          />
          <p className="mt-1 text-sm text-gray-500">
            Opsiyonel - Sadece giriş hareketleri için
          </p>
        </div>
      )}

      {/* Notlar */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Notlar
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Hareket hakkında ek bilgiler..."
        />
        <p className="mt-1 text-sm text-gray-500">
          Opsiyonel - Ek açıklamalar ekleyebilirsiniz
        </p>
      </div>

      {/* Referans Bilgileri */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Referans Bilgileri (Opsiyonel)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="reference_type"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Referans Tipi
            </label>
            <select
              id="reference_type"
              name="reference_type"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Yok</option>
              <option value="invoice">Fatura</option>
              <option value="order">Sipariş</option>
              <option value="production">Üretim</option>
              <option value="other">Diğer</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="reference_id"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Referans No/ID
            </label>
            <input
              type="text"
              id="reference_id"
              name="reference_id"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Örn: FT-2024-001"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
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
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/dashboard/stock")}
          disabled={loading}
        >
          İptal
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Kaydediliyor..." : "Hareketi Kaydet"}
        </Button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg
            className="w-5 h-5 text-blue-600 mr-3 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">💡 İpucu:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                <strong>Giriş:</strong> Yeni malzeme geldiğinde veya stok
                arttığında
              </li>
              <li>
                <strong>Çıkış:</strong> Üretimde kullanıldığında veya
                satıldığında
              </li>
              <li>
                <strong>Düzeltme:</strong> Sayım sonucu fark bulunduğunda veya
                manuel düzeltme gerektiğinde
              </li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
}
