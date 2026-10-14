'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { clearSession, logout, setUsage } from '@/lib/api';
import { currentAccount } from '@/lib/merchant';
import type { Me } from '@/lib/types';

const links = [
  { href: '/books', label: 'Home' },
  { href: '/books/customers', label: 'Customers' },
  { href: '/books/vendors', label: 'Vendors' },
  { href: '/books/cash', label: 'Cash book' },
  { href: '/books/reports', label: 'Reports' },
  { href: '/books/notifications', label: 'Notifications' },
  { href: '/books/business', label: 'Business' },
  { href: '/books/categories', label: 'Categories' },
  { href: '/books/audit', label: 'Audit' },
];

const MerchantContext = createContext<Me | null>(null);

export function useMerchant(): Me | null {
  return useContext(MerchantContext);
}

export function MerchantShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [account, setAccount] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    currentAccount()
      .then((next) => {
        if (cancelled) return;
        if (next.user.role !== 'merchant') {
          router.replace(next.user.role === 'admin' ? '/admin' : '/');
          return;
        }
        setAccount(next);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) router.replace('/');
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!account || account.subscription?.active) return;
    const allowed = pathname === '/books' || pathname.startsWith('/books/business') || pathname.startsWith('/books/notifications');
    if (!allowed) router.replace('/books');
  }, [account, pathname, router]);

  async function signOut() {
    try {
      await logout();
    } catch {
      // Local session is cleared either way.
    }
    clearSession();
    router.replace('/');
  }

  if (!ready || !account) {
    return <p className="p-10 text-sm text-[var(--muted)]">Opening your books…</p>;
  }

  const ledgerOpen = account.subscription?.active === true;
  const personal = account.user.usage !== 'shop';
  const visibleLinks = personal
    ? [
        { href: '/books', label: 'Home' },
        { href: '/books/customers', label: 'Friends & family' },
        { href: '/books/expenses/new', label: 'Personal expense' },
        { href: '/books/notifications', label: 'Notifications' },
      ]
    : links;

  return (
    <MerchantContext.Provider value={account}>
      <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-[var(--line)] bg-[#0e3b2c] text-[#f3efe6] lg:min-h-screen lg:border-b-0 lg:border-r">
          <div className="px-5 py-6">
            <p className="text-xs tracking-[0.16em] text-[#d7c08a] uppercase">Entrybook</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl">{account.business?.name ?? 'Shop'}</p>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-3 pb-4 lg:block">
            {visibleLinks.map((link) => {
              const active = pathname === link.href;
              const blocked = !ledgerOpen && link.href !== '/books' && link.href !== '/books/business' && link.href !== '/books/notifications';
              if (blocked) return null;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-xl px-3 py-2 text-sm whitespace-nowrap ${active ? 'bg-white/15' : 'hover:bg-white/10'}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden px-5 pb-6 lg:block">
            <p className="text-sm">{account.user.name}</p>
            <p className="text-xs text-[#b7cfc4]">{account.user.email}</p>
            <button
              type="button"
              onClick={() => {
                setUsage(personal ? 'shop' : 'personal').then(setAccount).catch(() => undefined);
              }}
              className="mt-4 block text-sm text-[#d7c08a]"
            >
              {personal ? 'Switch to shop owner' : 'Switch to personal'}
            </button>
            <button type="button" onClick={signOut} className="mt-4 text-sm text-[#d7c08a]">
              Sign out
            </button>
          </div>
        </aside>
        <div>
          <header className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4 lg:hidden">
            <p className="text-sm">{account.user.email}</p>
            <button type="button" onClick={signOut} className="text-sm text-[var(--green)]">
              Sign out
            </button>
          </header>
          <div className="px-5 py-8 sm:px-8">{children}</div>
        </div>
      </div>
    </MerchantContext.Provider>
  );
}
