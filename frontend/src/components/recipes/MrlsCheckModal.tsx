'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, AlertTriangle, Send } from 'lucide-react';
import { checkRecipeCompliance } from '@/app/actions/compliance';
import { submitForApproval } from '@/app/actions/recipes';

interface Props {
    recipeId: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface ComplianceResult {
    is_compliant: boolean;
    analyzed_at: string;
    detected_substances: Array<{
        ingredient_name: string;
        matched_mrls_name: string;
        cas_number: string;
        restriction_type: string;
        limit_value: string;
        page_number: number;
        status: 'FAIL' | 'WARNING' | 'PASS';
        explanation: string;
    }>;
    summary: string;
    recommendations: string[];
}

export default function MrlsCheckModal({ recipeId, onClose, onSuccess }: Props) {
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [checkResult, setCheckResult] = useState<ComplianceResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(Array.from(e.target.files));
            setError(null);
        }
    };

    const handleCheck = async () => {
        if (files.length === 0) {
            setError('Lütfen en az bir MRLS/OEKOTEX (PDF) dosyası yükleyin.');
            return;
        }

        setLoading(true);
        setError(null);
        setCheckResult(null);

        const formData = new FormData();
        formData.append('recipeId', recipeId);
        files.forEach((file) => {
            formData.append('files', file);
        });

        try {
            const response = await checkRecipeCompliance(formData);
            if (response.success) {
                setCheckResult(response.data);
            } else {
                setError(response.error as string);
            }
        } catch (err) {
            setError('Analiz sırasında bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitForApproval = async () => {
        if (!checkResult?.is_compliant) return;

        setSubmitting(true);
        try {
            const result = await submitForApproval(recipeId, JSON.stringify(checkResult));
            if (result.success) {
                onSuccess();
            } else {
                setError(result.error as string);
            }
        } catch (err) {
            setError('Onaya gönderilirken bir hata oluştu.');
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
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!checkResult ? (
                        <div className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-blue-800 dark:text-blue-200 text-sm">
                                Reçeteyi yönetici onayına göndermeden önce MRLS (Manufacturing Restricted Substances List) kontrolünden geçmesi gerekmektedir. Lütfen güncel MRLS listesini yükleyin.
                            </div>

                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="modal-pdf-upload"
                                />
                                <label htmlFor="modal-pdf-upload" className="cursor-pointer flex flex-col items-center">
                                    <Upload className="h-12 w-12 text-gray-400 mb-3" />
                                    {files.length > 0 ? (
                                        <div className="flex flex-col gap-2 w-full max-w-md">
                                            <div className="text-green-600 font-medium mb-1">
                                                {files.length} Dosya Seçildi
                                            </div>
                                            {files.map((f, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                                    <FileText className="w-4 h-4 flex-shrink-0" />
                                                    <span className="truncate">{f.name}</span>
                                                    <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                                                        {(f.size / 1024 / 1024).toFixed(2)} MB
                                                    </span>
                                                </div>
                                            ))}
                                            <div className="text-xs text-blue-500 mt-2 font-medium">
                                                + Başka dosya eklemek için tıklayın
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-gray-900 dark:text-white font-medium text-lg">MRLS / OEKOTEX Dosyalarını Seçin</span>
                                            <span className="text-sm text-gray-500 mt-1">Birden fazla PDF seçebilirsiniz</span>
                                        </>
                                    )}
                                </label>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
                                    <AlertCircle className="w-5 h-5 mr-2" />
                                    {error}
                                </div>
                            )}

                            <Button
                                onClick={handleCheck}
                                disabled={files.length === 0 || loading}
                                className="w-full h-12 text-lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Yapay Zeka Analizi Yapılıyor...
                                    </>
                                ) : 'Kontrolü Başlat'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Result Banner */}
                            <div className={`p-6 rounded-xl border-l-8 shadow-sm ${checkResult.is_compliant
                                ? 'bg-green-50 border-green-500 text-green-900'
                                : 'bg-red-50 border-red-500 text-red-900'
                                }`}>
                                <div className="flex items-center gap-3 mb-2">
                                    {checkResult.is_compliant
                                        ? <CheckCircle className="w-8 h-8 text-green-600" />
                                        : <AlertCircle className="w-8 h-8 text-red-600" />
                                    }
                                    <h2 className="text-2xl font-bold">
                                        {checkResult.is_compliant ? 'UYUMLU (PASS)' : 'UYUMSUZ (FAIL)'}
                                    </h2>
                                </div>
                                <p className="opacity-90">{checkResult.summary}</p>
                            </div>

                            {/* Detailed Findings */}
                            {checkResult.detected_substances.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700 font-semibold">Tespit Edilen Riskler</div>
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {checkResult.detected_substances.map((item, idx) => (
                                            <div key={idx} className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-bold flex items-center gap-2">
                                                            {item.ingredient_name}
                                                            {item.status === 'FAIL' && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">FAIL</span>}
                                                            {item.status === 'WARNING' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">UYARI</span>}
                                                        </div>
                                                        <div className="text-xs text-gray-500">MRLS: {item.matched_mrls_name} | CAS: {item.cas_number}</div>
                                                    </div>
                                                    <div className="text-right text-xs">
                                                        <div className="font-mono">{item.limit_value}</div>
                                                        <div className="text-blue-600">Sayfa {item.page_number}</div>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{item.explanation}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {checkResult.recommendations.length > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <h3 className="text-blue-800 dark:text-blue-300 font-semibold mb-2 flex items-center">
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Öneriler
                                    </h3>
                                    <ul className="list-disc list-inside text-sm text-blue-900 dark:text-blue-200">
                                        {checkResult.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                                    </ul>
                                </div>
                            )}

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

                                {checkResult.is_compliant ? (
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
