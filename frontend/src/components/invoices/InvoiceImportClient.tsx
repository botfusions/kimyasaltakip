"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";
import {
  importInvoice,
  importInvoiceFromOCR,
} from "../../app/actions/invoices";
import type { InvoiceLine } from "../../lib/invoice-parser";

interface InvoiceImportClientProps {
  currentUser: any;
}

export default function InvoiceImportClient({
  currentUser,
}: InvoiceImportClientProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedExtensions = [".xml", ".pdf", ".jpg", ".jpeg", ".png"];
      const fileExtension = file.name
        .toLowerCase()
        .slice(file.name.lastIndexOf("."));

      if (!allowedExtensions.includes(fileExtension)) {
        setError("Sadece XML, PDF, JPEG ve PNG dosyaları yüklenebilir");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError("Lütfen bir dosya seçin");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fileExtension = selectedFile.name
        .toLowerCase()
        .slice(selectedFile.name.lastIndexOf("."));

      let importResult;

      if (fileExtension === ".xml") {
        // XML file - direct parsing
        const fileContent = await selectedFile.text();
        importResult = await importInvoice(fileContent);
      } else {
        // PDF or Image - OCR processing
        setError("OCR işlemi yapılıyor, lütfen bekleyin...");

        // Call OCR API
        const formData = new FormData();
        formData.append("file", selectedFile);

        const ocrResponse = await fetch("/api/ocr", {
          method: "POST",
          body: formData,
        });

        if (!ocrResponse.ok) {
          const errorData = await ocrResponse.json();
          throw new Error(errorData.error || "OCR işlemi başarısız oldu");
        }

        const ocrData = await ocrResponse.json();

        if (!ocrData.success || !ocrData.text) {
          throw new Error("OCR metni alınamadı");
        }

        // Import invoice from OCR text
        setError("Fatura bilgileri işleniyor...");
        importResult = await importInvoiceFromOCR(ocrData.text);
      }

      if (importResult.success) {
        setResult(importResult);
        setSelectedFile(null);
        setError(null);
        // Reset file input
        const fileInput = document.getElementById(
          "file-input",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setError(importResult.error || "Fatura içe aktarılamadı");
        setResult(importResult);
      }
    } catch (err: any) {
      setError(err.message || "Beklenmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          XML Dosyası Yükle
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="file-input"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-10 h-10 mb-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">
                    Dosya seçmek için tıklayın
                  </span>{" "}
                  veya sürükleyin
                </p>
                <p className="text-xs text-gray-500">
                  XML (.xml), PDF (.pdf), veya Görüntü (.jpg, .jpeg, .png)
                </p>
              </div>
              <input
                id="file-input"
                type="file"
                accept=".xml,.pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {selectedFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-blue-700">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!selectedFile || loading}
            variant="primary"
            className="w-full"
          >
            {loading ? "İçe Aktarılıyor..." : "Faturayı İçe Aktar"}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && !result?.success && (
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

      {/* Unmatched Products */}
      {result && result.unmatchedLines && result.unmatchedLines.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-orange-800 mb-2">
            Eşleşmeyen Ürünler ({result.unmatchedLines.length})
          </h3>
          <p className="text-sm text-orange-700 mb-3">
            Aşağıdaki ürünler sistemdeki malzemelerle eşleştirilemedi. Lütfen
            malzeme kodlarını kontrol edin.
          </p>
          <div className="bg-white rounded border border-orange-200 overflow-hidden">
            <table className="min-w-full divide-y divide-orange-200">
              <thead className="bg-orange-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-orange-800">
                    Kod
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-orange-800">
                    Ürün Adı
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-orange-800">
                    Miktar
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-orange-800">
                    Tutar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {result.unmatchedLines.map((line: InvoiceLine) => (
                  <tr key={line.lineNumber}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {line.productCode}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {line.productName}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-gray-900">
                      {line.quantity}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-gray-900">
                      {line.totalAmount.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {line.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Success Message */}
      {result && result.success && (
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
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">Başarılı!</h3>
              <div className="text-sm text-green-700 mt-1 space-y-1">
                <p>Fatura başarıyla içe aktarıldı</p>
                {result.invoice && (
                  <>
                    <p>• Fatura No: {result.invoice.invoiceNumber}</p>
                    <p>• Tedarikçi: {result.invoice.supplier}</p>
                  </>
                )}
                <p>• {result.matchedLines} ürün eşleştirildi</p>
                <p>• {result.stockMovements} stok hareketi oluşturuldu</p>
              </div>
              <div className="mt-4">
                <Button
                  onClick={() => router.push("/dashboard/stock")}
                  variant="primary"
                  size="sm"
                >
                  Stok Sayfasına Git
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Nasıl Kullanılır?
        </h3>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
          <li>
            Fatura dosyanızı seçin:
            <ul className="ml-6 mt-1 text-xs text-gray-600 list-disc">
              <li>
                <strong>XML</strong>: E-Fatura (UBL-TR formatı) - En hızlı ve
                doğru
              </li>
              <li>
                <strong>PDF</strong>: OCR ile otomatik metin çıkarma
              </li>
              <li>
                <strong>JPEG/PNG</strong>: Fotoğraf veya tarama - OCR ile
                işlenir
              </li>
            </ul>
          </li>
          <li>&quot;Faturayı İçe Aktar&quot; butonuna tıklayın</li>
          <li>PDF/JPEG için OCR işlemi yapılır (birkaç saniye sürebilir)</li>
          <li>
            Sistem otomatik olarak fatura satırlarını malzemelerle eşleştirir
          </li>
          <li>Eşleşen ürünler için otomatik stok girişi yapılır</li>
          <li>Eşleşmeyen ürünler varsa liste halinde gösterilir</li>
        </ol>

        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-800">
            <strong>💡 İpucu:</strong> En iyi sonuç için XML formatını kullanın.
            PDF ve görüntü dosyaları OCR ile işlenir ve %100 doğruluk garanti
            edilemez.
          </p>
        </div>
      </div>
    </div>
  );
}
