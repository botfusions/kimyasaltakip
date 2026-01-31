'use client';

import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/app/actions/settings';

interface SettingItem {
    id: string;
    key: string;
    value: string;
    category: string;
    description: string | null;
    is_editable: boolean;
}

export default function SettingsManagementPage() {
    const [settings, setSettings] = useState<SettingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state
    const [formData, setFormData] = useState<Record<string, string>>({});

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        const result = await getSettings();

        if (result.data) {
            setSettings(result.data);
            // Initialize form data
            const initialData: Record<string, string> = {};
            result.data.forEach((setting) => {
                initialData[setting.key] = setting.value;
            });
            setFormData(initialData);
        }

        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const result = await updateSettings(formData);

            if (result.success) {
                setMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi!' });
                await loadSettings(); // Reload to get updated values
            } else {
                setMessage({ type: 'error', text: result.error || 'Ayarlar kaydedilemedi' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: `Hata: ${error.message}` });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    // Group settings by category
    const emailSettings = settings.filter((s) => s.category === 'email');
    const otherSettings = settings.filter((s) => s.category !== 'email');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Ayarlar yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">⚙️ Sistem Ayarları</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Ayarları */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        📧 Email Ayarları
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Rapor ve bildirim emaillerinin gönderilmesi için gerekli ayarlar.
                    </p>

                    <div className="space-y-4">
                        {emailSettings.map((setting) => (
                            <div key={setting.id}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {setting.key === 'RESEND_API_KEY' && '🔑 Resend API Key'}
                                    {setting.key === 'EMAIL_FROM_ADDRESS' && '📨 Gönderici Email Adresi'}
                                    {setting.key === 'REPORT_RECEIVER_EMAILS' && '👥 Rapor Alıcı Email Adresleri'}
                                </label>
                                {setting.description && (
                                    <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
                                )}
                                <input
                                    type={setting.key === 'RESEND_API_KEY' ? 'password' : 'text'}
                                    value={formData[setting.key] || ''}
                                    onChange={(e) => handleChange(setting.key, e.target.value)}
                                    disabled={!setting.is_editable}
                                    placeholder={
                                        setting.key === 'REPORT_RECEIVER_EMAILS'
                                            ? 'ornek1@firma.com, ornek2@firma.com'
                                            : ''
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                />
                                {setting.key === 'REPORT_RECEIVER_EMAILS' && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Birden fazla email için virgül (,) ile ayırın. Örnek: muhasebe@firma.com,
                                        yonetim@firma.com
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Diğer Ayarlar */}
                {otherSettings.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">🔧 Diğer Ayarlar</h2>
                        <div className="space-y-4">
                            {otherSettings.map((setting) => (
                                <div key={setting.id}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {setting.key}
                                    </label>
                                    {setting.description && (
                                        <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
                                    )}
                                    <input
                                        type="text"
                                        value={formData[setting.key] || ''}
                                        onChange={(e) => handleChange(setting.key, e.target.value)}
                                        disabled={!setting.is_editable}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Success/Error Message */}
                {message && (
                    <div
                        className={`p-4 rounded-lg ${message.type === 'success'
                                ? 'bg-green-50 border border-green-200 text-green-800'
                                : 'bg-red-50 border border-red-200 text-red-800'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                    >
                        {saving ? 'Kaydediliyor...' : '💾 Ayarları Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    );
}
