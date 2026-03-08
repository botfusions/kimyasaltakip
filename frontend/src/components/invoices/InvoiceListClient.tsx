"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";
import { deleteInvoiceImport } from "../../app/actions/invoices";

interface Invoice {
  invoice_number: string;
  supplier: string;
  invoice_date: string;
  total_amount: number;
  currency: string;
  matched_lines?: number;
  total_lines?: number;
  created_at: string;
}

interface InvoiceListClientProps {
  invoices: Invoice[];
  currentUser: any;
}

export default function InvoiceListClient({
  invoices,
  currentUser,
}: InvoiceListClientProps) {
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDelete = async (invoiceNumber: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await deleteInvoiceImport(invoiceNumber);

      if (result.success) {
        setSuccess(
          `${invoiceNumber} numaralı fatura başarıyla silindi. ${result.deletedCount} stok hareketi geri alındı.`,
        );
        setDeleteConfirm(null);
        router.refresh();
      } else {
        setError(result.error || "Fatura silinemedi");
      }
    } catch (err: any) {
      setError(err.message || "Beklenmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Group invoices by invoice number
  const groupedInvoices = invoices.reduce(
    (acc, invoice) => {
      if (!acc[invoice.invoice_number]) {
        acc[invoice.invoice_number] = invoice;
      }
      return acc;
    },
    {} as Record<string, Invoice>,
  );

  const uniqueInvoices = Object.values(groupedInvoices).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Toplam Fatura</p>
              <p className="text-2xl font-bold text-gray-900">
                {uniqueInvoices.length}
              </p>
            </div>
            <div className="text-3xl">📄</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Bu Ay</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  uniqueInvoices.filter((inv) => {
                    const invoiceDate = new Date(inv.created_at);
                    const now = new Date();
                    return (
                      invoiceDate.getMonth() === now.getMonth() &&
                      invoiceDate.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </p>
            </div>
            <div className="text-3xl">📅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Toplam Tutar</p>
              <p className="text-2xl font-bold text-gray-900">
                {uniqueInvoices
                  .reduce((sum, inv) => sum + inv.total_amount, 0)
                  .toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                ₺
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-600 mr-2 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800">Başarılı</h3>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Invoice Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Fatura Geçmişi
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            İçe aktarılan {uniqueInvoices.length} faturanın listesi
          </p>
        </div>

        {uniqueInvoices.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Henüz fatura yok
            </h3>
            <p className="text-gray-600 mb-4">
              Fatura içe aktarmak için yukarıdaki butonu kullanın
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fatura No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tedarikçi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün Sayısı
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uniqueInvoices.map((invoice) => (
                  <tr key={invoice.invoice_number} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.supplier}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(invoice.invoice_date).toLocaleDateString(
                          "tr-TR",
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.total_amount.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {invoice.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {invoice.matched_lines || 0} /{" "}
                        {invoice.total_lines || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {["admin", "warehouse"].includes(currentUser.role) && (
                        <button
                          onClick={() =>
                            setDeleteConfirm(invoice.invoice_number)
                          }
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Faturayı Sil"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Faturayı Sil
                </h3>
                <div className="mt-2 px-4 py-3">
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>{deleteConfirm}</strong> numaralı faturayı silmek
                    istediğinizden emin misiniz?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
                    <p className="text-xs font-medium text-red-800 mb-2">
                      ⚠️ Bu işlem:
                    </p>
                    <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                      <li>Bu faturaya ait tüm stok hareketlerini silecek</li>
                      <li>Stok miktarlarını geri alacak</li>
                      <li>
                        Bu işlem <strong>GERİ ALINAMAZ</strong>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-3 px-4 py-3">
                  <Button
                    onClick={() => setDeleteConfirm(null)}
                    variant="secondary"
                    className="flex-1"
                    disabled={loading}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={() => handleDelete(deleteConfirm)}
                    variant="primary"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={loading}
                  >
                    {loading ? "Siliniyor..." : "Evet, Sil"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
