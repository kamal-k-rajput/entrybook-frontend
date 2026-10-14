'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearSession, getStoredUser, logout } from '@/lib/api';
import { SITE_HOST } from '@/lib/site';
import type { UserProfile } from '@/lib/types';

const links = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/merchants', label: 'Merchants' },
  { href: '/admin/subscriptions', label: 'Subscriptions' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = getStoredUser<UserProfile>();
    if (!stored || stored.role !== 'admin') {
      router.replace('/');
      return;
    }
    setUser(stored);
    setReady(true);
  }, [router]);

  async function signOut() {
    try {
      await logout();
    } catch {
      // The local session is cleared either way.
    }
    clearSession();
    router.replace('/');
  }

  if (!ready || !user) {
    return <p className="p-10 text-sm text-[var(--muted)]">Opening the admin panel…</p>;
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-[var(--line)] bg-[#0e3b2c] text-[#f3efe6] lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="px-5 py-6">
          <p className="text-xs tracking-[0.16em] text-[#d7c08a] uppercase">Entrybook</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl">Admin</p>
          <p className="mt-2 text-xs text-[#b7cfc4]">{SITE_HOST}</p>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-4 lg:block lg:px-3">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-xl px-3 py-2 text-sm whitespace-nowrap ${
                  active ? 'bg-white/15' : 'hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden px-5 pb-6 lg:block">
          <p className="text-sm">{user.name}</p>
          <p className="text-xs text-[#b7cfc4]">{user.email}</p>
          <button type="button" onClick={signOut} className="mt-4 text-sm text-[#d7c08a]">
            Sign out
          </button>
        </div>
      </aside>
      <div>
        <header className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4 lg:hidden">
          <p className="text-sm">{user.email}</p>
          <button type="button" onClick={signOut} className="text-sm text-[var(--green)]">
            Sign out
          </button>
        </header>
        <div className="px-5 py-8 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
