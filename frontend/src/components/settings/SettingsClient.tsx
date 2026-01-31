'use client';

import { useState, useEffect } from 'react';
import { getSettings, updateSetting } from '@/app/actions/settings';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Save, Key, Shield, Settings as SettingsIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Setting {
    id: string;
    key: string;
    value: string;
    description: string;
    category: string;
}

export default function SettingsClient() {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        const result = await getSettings();
        if (result.error) {
            setError(result.error);
        } else {
            setSettings(result.data || []);
        }
        setIsLoading(false);
    };

    const handleUpdate = async (key: string, value: string) => {
        setIsSaving(key);
        setError('');
        setSuccess('');

        const result = await updateSetting(key, value);
        if (!result.success) {
            setError(result.error || 'Güncelleme sırasında bir hata oluştu.');
        } else {
            setSuccess('Ayar başarıyla güncellendi.');
            setTimeout(() => setSuccess(''), 3000);
        }
        setIsSaving(null);
    };

    const handleValueChange = (key: string, newValue: string) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <SettingsIcon className="w-8 h-8 text-blue-600" />
                    Sistem Ayarları
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Uygulama genelindeki kritik yapılandırmaları ve API anahtarlarını yönetin.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-3 items-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex gap-3 items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
                </div>
            )}

            <div className="space-y-6">
                {/* Categories Grouping */}
                {['general', 'api', 'security'].map(category => {
                    const categorySettings = settings.filter(s => s.category === category);
                    if (categorySettings.length === 0) return null;

                    return (
                        <div key={category} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                {category === 'api' && <Key className="w-4 h-4 text-amber-500" />}
                                {category === 'security' && <Shield className="w-4 h-4 text-red-500" />}
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                                    {category === 'api' ? 'API Bağlantıları' : category === 'security' ? 'Güvenlik Yapılandırması' : 'Genel Ayarlar'}
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {categorySettings.map(setting => (
                                    <div key={setting.id} className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
                                                    {setting.key.replace(/_/g, ' ')}
                                                </label>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {setting.description || 'Bu ayar için açıklama girilmemiş.'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 w-full md:w-2/3">
                                                <Input
                                                    type={setting.key.includes('KEY') || setting.key.includes('SECRET') ? 'password' : 'text'}
                                                    value={setting.value}
                                                    onChange={(e) => handleValueChange(setting.key, e.target.value)}
                                                    className="font-mono text-sm"
                                                    placeholder="Değer giriniz..."
                                                />
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleUpdate(setting.key, setting.value)}
                                                    disabled={isSaving === setting.key}
                                                    className="shrink-0"
                                                >
                                                    {isSaving === setting.key ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Save className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
