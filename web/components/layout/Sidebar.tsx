'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, ShoppingBasket, TrendingUp, FileText,
  Users, Package, BarChart3, LogOut, Leaf, Languages,
} from 'lucide-react';

const COMPANY_NAV = [
  { href: '/dashboard',       icon: LayoutDashboard, key: 'dashboard' },
  { href: '/crop-listings',   icon: ShoppingBasket,  key: 'cropListings' },
  { href: '/offers',          icon: FileText,        key: 'offers' },
  { href: '/analytics',       icon: TrendingUp,      key: 'analytics' },
];

const ADMIN_NAV = [
  { href: '/admin',               icon: LayoutDashboard, key: 'dashboard' },
  { href: '/admin/users',         icon: Users,           key: 'users' },
  { href: '/admin/products',      icon: Package,         key: 'products' },
  { href: '/admin/analytics',     icon: BarChart3,       key: 'analytics' },
];

interface SidebarProps {
  role: 'company' | 'admin';
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const nav      = role === 'admin' ? ADMIN_NAV : COMPANY_NAV;
  const { t, i18n } = useTranslation();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'bn' ? 'en' : 'bn');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-30">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl green-gradient flex items-center justify-center shadow-sm">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">KrishiConnect</p>
            <p className="text-xs text-gray-400 capitalize">{role === 'admin' ? t('adminPortal') : t('companyPortal')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
        {nav.map(({ href, icon: Icon, key }) => {
          const active = pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-1">
        <button className="sidebar-link w-full" onClick={toggleLang}>
          <Languages className="w-4 h-4" />
          <span>{t('language')}: {i18n.language.toUpperCase()}</span>
        </button>
        <button className="sidebar-link w-full text-left text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => signOut({ callbackUrl: '/dashboard' })}>
          <LogOut className="w-4 h-4" />
          <span>{t('signOut')}</span>
        </button>
      </div>
    </aside>
  );
}
