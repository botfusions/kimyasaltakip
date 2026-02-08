'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <span className="text-gray-400">🌙</span>
            </button>
        );
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
            {theme === 'dark' ? (
                <span className="text-yellow-500">☀️</span>
            ) : (
                <span className="text-gray-600">🌙</span>
            )}
        </button>
    );
}
