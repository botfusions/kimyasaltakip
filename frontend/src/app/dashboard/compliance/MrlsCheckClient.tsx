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
    status: 'pass' | 'fail' | 'warning';
    violations: Array<{
        standard: string;
        material: string;
        cas: string;
        limit: string;
        status: string;
    }>;
    message: string;
}

export default function MrlsCheckClient() {
    const supabase = createClientComponentClient();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<string>('');
    // const [file, setFile] = useState<File | null>(null); // Removed file upload
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
        if (!selectedRecipe) {
            setError('Lütfen bir reçete seçin.');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await checkRecipeCompliance(selectedRecipe);

            if (response.success) {
                setResult(response as ComplianceResult);
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



                {/* Action Button */}
                <button
                    onClick={handleCheck}
                    disabled={loading || !selectedRecipe}
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
                            Sistem Kontrolünü Başlat
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
                        <div className={`p-6 rounded-xl border-l-8 shadow-sm ${result.status === 'pass'
                            ? 'bg-green-50 border-green-500 text-green-900'
                            : 'bg-red-50 border-red-500 text-red-900'
                            }`}>
                            <div className="flex items-center gap-3 mb-2">
                                {result.status === 'pass'
                                    ? <CheckCircle className="w-8 h-8 text-green-600" />
                                    : <AlertCircle className="w-8 h-8 text-red-600" />
                                }
                                <h2 className="text-2xl font-bold">
                                    {result.status === 'pass' ? 'UYUMLU (PASS)' : 'UYUMSUZ (FAIL)'}
                                </h2>
                            </div>
                            <p className="opacity-90">{result.message}</p>
                        </div>

                        {/* Detailed Findings */}
                        {result.violations && result.violations.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 font-semibold flex items-center justify-between">
                                    <span>Tespit Edilen Riskler</span>
                                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">
                                        {result.violations.length} Madde
                                    </span>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {result.violations.map((item, idx) => (
                                        <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                        {item.material}
                                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">FAIL</span>
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Standart: {item.standard} | CAS: {item.cas}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        Limit: {item.limit}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                    </div>
                )}
            </div>
        </div>
    );
}
