'use client';

import { useState } from 'react';
import { signOut } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ThemeToggle';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface HeaderProps {
    user: User;
}

export default function DashboardHeader({ user }: HeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        await signOut();
    };

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
            lab: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            production: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            warehouse: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        };
        return colors[role] || 'bg-gray-100 text-gray-800';
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            admin: 'Yönetici',
            lab: 'Laboratuvar',
            production: 'Üretim',
            warehouse: 'Depo',
        };
        return labels[role] || role;
    };

    return (
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
            <div className="flex-1"></div>

            {/* Theme Toggle & User Menu */}
            <div className="flex items-center gap-3">
                <ThemeToggle />

                {/* User Menu */}
                <div className="relative">
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-3 py-2 transition-colors"
                >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                        </p>
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getRoleBadgeColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                        </span>
                    </div>

                    {/* Dropdown Icon */}
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsDropdownOpen(false)}
                        />

                        {/* Dropdown */}
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>

                            <div className="p-2">
                                <Button
                                    variant="danger"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={handleSignOut}
                                    isLoading={isLoggingOut}
                                >
                                    🚪 Çıkış Yap
                                </Button>
                            </div>
                        </div>
                    </>
                )}
                </div>
            </div>
        </header>
    );
}
