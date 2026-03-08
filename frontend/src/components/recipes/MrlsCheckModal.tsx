"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Send,
} from "lucide-react";
import { checkRecipeCompliance } from "../../app/actions/compliance";
import { submitForApproval } from "../../app/actions/recipes";

interface Props {
  recipeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface ComplianceResult {
  status: "pass" | "fail" | "warning";
  violations: Array<{
    standard: string;
    material: string;
    cas: string;
    limit: string;
    status: string;
  }>;
  message: string;
}

export default function MrlsCheckModal({
  recipeId,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<ComplianceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    setCheckResult(null);

    try {
      const response = await checkRecipeCompliance(recipeId);
      if (response.success) {
        // Map API response to component state
        setCheckResult(response as unknown as ComplianceResult);
      } else {
        setError(response.error as string);
      }
    } catch (err) {
      setError("Analiz sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (checkResult?.status === "fail") return;

    setSubmitting(true);
    try {
      const result = await submitForApproval(
        recipeId,
        JSON.stringify(checkResult),
      );
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error as string);
      }
    } catch (err) {
      setError("Onaya gönderilirken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🛡️ MRLS Uyumluluk Kontrolü ve Ön Onay
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!checkResult ? (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-blue-800 dark:text-blue-200 text-sm">
                Reçeteyi yönetici onayına göndermeden önce Sistem Veritabanı
                (MRLS/OEKOTEX) üzerinden otomatik kontrol yapılacaktır.
              </div>

              {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleCheck}
                disabled={loading}
                className="w-full h-12 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Sistem Kontrolü Yapılıyor...
                  </>
                ) : (
                  "Kontrolü Başlat"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Result Banner */}
              <div
                className={`p-6 rounded-xl border-l-8 shadow-sm ${
                  checkResult.status === "pass"
                    ? "bg-green-50 border-green-500 text-green-900"
                    : "bg-red-50 border-red-500 text-red-900"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {checkResult.status === "pass" ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  )}
                  <h2 className="text-2xl font-bold">
                    {checkResult.status === "pass"
                      ? "UYUMLU (PASS)"
                      : "UYUMSUZ (FAIL)"}
                  </h2>
                </div>
                <p className="opacity-90">{checkResult.message}</p>
              </div>

              {/* Detailed Findings */}
              {checkResult.violations && checkResult.violations.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 font-semibold">
                    Tespit Edilen Riskler
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {checkResult.violations.map((item, idx) => (
                      <div key={idx} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              {item.material}
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                FAIL
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Standart: {item.standard} | CAS: {item.cas}
                            </div>
                          </div>
                          <div className="text-right text-xs">
                            <div className="font-mono">Limit: {item.limit}</div>
                          </div>
                        </div>
                        {/* <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{item.explanation}</p> */}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations logic removed as it's not in API response yet */}

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => setCheckResult(null)}
                  disabled={submitting}
                  className="flex-1"
                >
                  Tekrar Kontrol Et
                </Button>

                {checkResult.status === "pass" ? (
                  <Button
                    onClick={handleSubmitForApproval}
                    disabled={submitting}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Yönetici Onayına Gönder
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    disabled
                    className="flex-1 opacity-50 cursor-not-allowed"
                  >
                    Düzeltme Gerekli
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
