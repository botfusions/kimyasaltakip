'use client';

import { useState, FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createUser, updateUser } from '@/app/actions/users';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    is_active: boolean;
    phone: string | null;
    signature_id: string | null;
    created_at: string;
    last_login_at: string | null;
}

interface Props {
    user: User | null;
    onClose: (updatedUser?: User) => void;
}

export default function UserModal({ user, onClose }: Props) {
    const isEditing = !!user;

    const [formData, setFormData] = useState({
        email: user?.email || '',
        name: user?.name || '',
        role: user?.role || 'lab',
        phone: user?.phone || '',
        is_active: user?.is_active ?? true,
    });

    const [copySuccess, setCopySuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const formDataObj = new FormData();
            formDataObj.append('email', formData.email);
            formDataObj.append('name', formData.name);
            formDataObj.append('role', formData.role);
            formDataObj.append('phone', formData.phone);
            formDataObj.append('is_active', formData.is_active.toString());

            const result = isEditing
                ? await updateUser(user.id, formDataObj)
                : await createUser(formDataObj);

            if (result.error) {
                setError(result.error);
            } else {
                onClose(result.data);
            }
        } catch (err) {
            setError('Beklenmeyen bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopySignatureId = async () => {
        if (user?.signature_id) {
            await navigator.clipboard.writeText(user.signature_id);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={() => onClose()}
            title={isEditing ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {/* Name */}
                <Input
                    label="İsim Soyisim"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="örn. Ahmet Yılmaz"
                    required
                />

                {/* Email */}
                <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ornek@email.com"
                    required
                />

                {/* Phone */}
                <Input
                    label="Telefon"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+90 555 123 45 67"
                    helperText="Opsiyonel"
                />

                {/* Role */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rol
                    </label>
                    <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        required
                    >
                        <option value="admin">Yönetici</option>
                        <option value="lab">Laboratuvar</option>
                        <option value="production">Üretim</option>
                        <option value="warehouse">Depo</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formData.role === 'admin' && 'Tüm yetkilere sahip'}
                        {formData.role === 'lab' && 'Reçete ve malzeme yönetimi'}
                        {formData.role === 'production' && 'Üretim takibi ve raporlama'}
                        {formData.role === 'warehouse' && 'Stok ve depo yönetimi'}
                    </p>
                </div>

                {/* Signature ID Display (for lab users only) */}
                {isEditing && user?.role === 'lab' && user?.signature_id && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                                    İmza ID
                                </label>
                                <p className="text-2xl font-mono font-bold text-blue-900 dark:text-blue-100">
                                    {user.signature_id}
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                    ⚠️ Bu ID'yi güvenli tutun - reçete onayı için gereklidir
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCopySignatureId}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                {copySuccess ? '✓ Kopyalandı!' : '📋 Kopyala'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Active Status */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Aktif Kullanıcı
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onClose()}
                        className="flex-1"
                        disabled={isLoading}
                    >
                        İptal
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        className="flex-1"
                        isLoading={isLoading}
                    >
                        {isEditing ? 'Güncelle' : 'Oluştur'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
