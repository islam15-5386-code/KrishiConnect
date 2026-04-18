'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { BarChart3, FileStack, Home, MessageSquareWarning, Shield, UserCircle2, Users } from 'lucide-react';

const companyNav = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/crop-listings', label: 'Crop Listings', icon: FileStack },
];

const adminNav = [
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/advisory', label: 'Advisory', icon: MessageSquareWarning, badge: '4' },
];

function NavItem({ href, label, Icon, badge }: { href: string; label: string; Icon: any; badge?: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm transition ${
        active
          ? 'bg-krishi-mid text-krishi-light border-l-[3px] border-l-krishi-green'
          : 'text-krishi-light/85 hover:bg-krishi-mid/70 hover:text-krishi-light'
      }`}
    >
      <span className="flex items-center gap-2">
        <Icon size={16} />
        <span className="font-medium">{label}</span>
      </span>
      {badge ? <span className="rounded-full bg-krishi-yellow px-2 py-0.5 text-[10px] text-krishi-dark">{badge}</span> : null}
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[180px] bg-krishi-dark p-3">
      <div className="rounded-lg border border-krishi-border/20 p-3">
        <h1 className="text-sm font-medium text-krishi-light">KrishiConnect</h1>
        <p className="mt-1 text-xs text-krishi-muted">কৃষি সংযোগ</p>
      </div>

      <div className="mt-4">
        <p className="px-1 text-[11px] uppercase tracking-wide text-krishi-muted">Company</p>
        <div className="mt-2 space-y-1">
          {companyNav.map((item) => (
            <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} />
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="px-1 text-[11px] uppercase tracking-wide text-krishi-muted">Admin</p>
        <div className="mt-2 space-y-1">
          {adminNav.map((item) => (
            <NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} badge={item.badge} />
          ))}
        </div>
      </div>

      <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-krishi-border/25 p-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-krishi-mid p-1.5 text-krishi-light">
            <UserCircle2 size={16} />
          </div>
          <div>
            <p className="text-xs font-medium text-krishi-light">GreenHarvest Ltd.</p>
            <p className="text-[11px] text-krishi-muted">Company Admin</p>
          </div>
        </div>
        <button
          type="button"
          className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-krishi-border/30 px-2 py-1 text-xs text-krishi-light hover:bg-krishi-mid"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <Shield size={12} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
