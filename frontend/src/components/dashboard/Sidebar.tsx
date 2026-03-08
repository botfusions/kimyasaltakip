"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";

interface SidebarProps {
  user: any;
}

export default function DashboardSidebar({ user }: SidebarProps) {
  const userRole = user?.role || "user";
  const pathname = usePathname();

  const menuItems = [
    {
      href: "/dashboard",
      label: "Ana Sayfa",
      icon: "🏠",
      roles: ["admin", "lab", "production", "warehouse"],
    },
    {
      href: "/dashboard/users",
      label: "Kullanıcılar",
      icon: "👥",
      roles: ["admin"],
    },
    {
      href: "/dashboard/materials",
      label: "Malzemeler",
      icon: "🧪",
      roles: ["admin", "lab", "warehouse"],
    },
    {
      href: "/dashboard/products",
      label: "Ürünler",
      icon: "🎨",
      roles: ["admin", "lab"],
    },
    {
      href: "/dashboard/recipes",
      label: "Reçeteler",
      icon: "📋",
      roles: ["admin", "lab"],
    },
    {
      href: "/dashboard/stock",
      label: "Stok",
      icon: "📦",
      roles: ["admin", "warehouse"],
    },
    {
      href: "/dashboard/production",
      label: "Üretim",
      icon: "⚙️",
      roles: ["admin", "production"],
    },
    {
      href: "/dashboard/reports",
      label: "Raporlar",
      icon: "📊",
      roles: ["admin", "lab", "production"],
    },
    {
      href: "/dashboard/settings/intelligence",
      label: "Bilgi Bankası (RAG)",
      icon: "📚",
      roles: ["admin"],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole),
  );

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Kimyasal Takip
        </h1>
      </div>

      {/* Menu Items */}
      <nav className="p-4 space-y-1">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
