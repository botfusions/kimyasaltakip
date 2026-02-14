'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { checkRecipeCompliance } from '@/app/actions/compliance';
import { AlertCircle, CheckCircle, FileText, Loader2, Upload, Search, AlertTriangle } from 'lucide-react';

interface Recipe {
    id: string;
    product: {
        name: string;
        code: string;
    };
    created_at: string;
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

export default function MrlsCheckClient() {
    const supabase = createClientComponentClient();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ComplianceResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadRecipes();
    }, []);

    async function loadRecipes() {
        const { data } = await supabase
            .from('recipes')
            .select('id, created_at, product:products(name, code)')
            .eq('status', 'approved') // Only approved recipes
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) setRecipes(data as any);
    }

    async function handleCheck() {
        if (!selectedRecipe || !file) {
            setError('Lütfen bir reçete seçin ve PDF dosyası yükleyin.');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('recipeId', selectedRecipe);
        formData.append('file', file);

        try {
            const response = await checkRecipeCompliance(formData);

            if (response.success) {
                setResult(response.data);
            } else {
                setError(response.error as string);
            }
        } catch (err) {
            setError('Beklenmeyen bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    }

    const filteredRecipes = recipes.filter(r =>
        r.product.name.toLowerCase().includes(search.toLowerCase()) ||
        r.product.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN: Input Form */}
            <div className="space-y-6">

                {/* 1. Recipe Selection */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                        Reçete Seçimi
                    </h2>

                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Reçete ara..."
                            className="w-full pl-10 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto border rounded-lg dark:border-gray-600">
                        {filteredRecipes.map((recipe) => (
                            <div
                                key={recipe.id}
                                onClick={() => setSelectedRecipe(recipe.id)}
                                className={`p-3 cursor-pointer border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedRecipe === recipe.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                                    }`}
                            >
                                <div className="font-medium text-gray-900 dark:text-white">{recipe.product.name}</div>
                                <div className="text-sm text-gray-500">{recipe.product.code}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. PDF Upload */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                        MRLS Dosyası Yükle (PDF)
                    </h2>

                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="pdf-upload"
                        />
                        <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                            <Upload className="h-10 w-10 text-gray-400 mb-3" />
                            {file ? (
                                <div className="text-green-600 font-medium flex items-center">
                                    <FileText className="w-4 h-4 mr-2" />
                                    {file.name}
                                </div>
                            ) : (
                                <>
                                    <span className="text-gray-900 dark:text-white font-medium">Dosya Seçmek İçin Tıkla</span>
                                    <span className="text-sm text-gray-500 mt-1">Sadece PDF formatı (Max 50MB)</span>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleCheck}
                    disabled={loading || !selectedRecipe || !file}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" />
                            Analiz Yapılıyor (Yaklaşık 10-20 sn)...
                        </>
                    ) : (
                        <>
                            <CheckCircle />
                            Uyumluluk Kontrolünü Başlat
                        </>
                    )}
                </button>

                {error && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: Results */}
            <div className="space-y-6">
                {!result && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12">
                        <FileText className="w-16 h-16 mb-4 opacity-20" />
                        <p>Analiz sonuçları burada görünecek.</p>
                    </div>
                )}

                {result && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-500">
                        {/* Status Banner */}
                        <div className={`p-6 rounded-xl border-l-8 shadow-sm ${result.is_compliant
                                ? 'bg-green-50 border-green-500 text-green-900'
                                : 'bg-red-50 border-red-500 text-red-900'
                            }`}>
                            <div className="flex items-center gap-3 mb-2">
                                {result.is_compliant
                                    ? <CheckCircle className="w-8 h-8 text-green-600" />
                                    : <AlertCircle className="w-8 h-8 text-red-600" />
                                }
                                <h2 className="text-2xl font-bold">
                                    {result.is_compliant ? 'UYUMLU (PASS)' : 'UYUMSUZ (FAIL)'}
                                </h2>
                            </div>
                            <p className="opacity-90">{result.summary}</p>
                        </div>

                        {/* Detailed Findings */}
                        {result.detected_substances.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 font-semibold flex items-center justify-between">
                                    <span>Tespit Edilen Riskler</span>
                                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">
                                        {result.detected_substances.length} Madde
                                    </span>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {result.detected_substances.map((item, idx) => (
                                        <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                        {item.ingredient_name}
                                                        {item.status === 'FAIL' && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">FAIL</span>}
                                                        {item.status === 'WARNING' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">UYARI</span>}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        MRLS Adı: {item.matched_mrls_name} | CAS: {item.cas_number}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        Limit: {item.limit_value}
                                                    </div>
                                                    <div className="text-xs text-blue-600 flex items-center justify-end mt-1">
                                                        <FileText className="w-3 h-3 mr-1" />
                                                        Sayfa {item.page_number}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                                                {item.explanation}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recommendations */}
                        {result.recommendations.length > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                                <h3 className="text-blue-800 dark:text-blue-300 font-semibold mb-3 flex items-center">
                                    <AlertTriangle className="w-5 h-5 mr-2" />
                                    Önerilen Aksiyonlar
                                </h3>
                                <ul className="list-disc list-inside space-y-2 text-blue-900 dark:text-blue-200">
                                    {result.recommendations.map((rec, i) => (
                                        <li key={i}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
