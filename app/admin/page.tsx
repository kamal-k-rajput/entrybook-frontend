'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StatusPill } from '@/components/status-pill';
import { ApiError, listMerchants, listSubscriptions } from '@/lib/api';
import type { MerchantRecord, Subscription } from '@/lib/types';

export default function AdminHomePage() {
  const [merchants, setMerchants] = useState<MerchantRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([listMerchants({}), listSubscriptions({ limit: 100 })])
      .then(([merchantPage, subscriptionPage]) => {
        if (cancelled) return;
        setMerchants(merchantPage.items);
        setSubscriptions(subscriptionPage.items);
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof ApiError ? caught.message : 'Could not load the overview.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = subscriptions.reduce<Record<string, number>>((total, item) => {
    total[item.status] = (total[item.status] ?? 0) + 1;
    return total;
  }, {});

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Overview</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        Turn a subscription on only after the payment has arrived. The end date is the last day the merchant can use the books.
      </p>
      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {(['pending', 'active', 'expired', 'suspended'] as const).map((status) => (
          <Link
            key={status}
            href={`/admin/subscriptions?status=${status}`}
            className="rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-4"
          >
            <StatusPill status={status} />
            <p className="mt-4 font-[family-name:var(--font-display)] text-3xl">{counts[status] ?? 0}</p>
          </Link>
        ))}
      </div>
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Recent merchants</h2>
          <Link href="/admin/merchants" className="text-sm text-[var(--green)]">
            View all
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--paper-2)]">
          {merchants.length === 0 ? (
            <li className="px-4 py-6 text-sm text-[var(--muted)]">No merchants yet.</li>
          ) : (
            merchants.slice(0, 6).map((merchant) => (
              <li key={merchant.user.id} className="flex items-center justify-between gap-4 px-4 py-4">
                <div>
                  <Link href={`/admin/merchants/${merchant.user.id}`} className="font-medium">
                    {merchant.business?.name ?? merchant.user.name}
                  </Link>
                  <p className="text-sm text-[var(--muted)]">{merchant.user.email}</p>
                </div>
                <StatusPill status={merchant.subscription?.status} />
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
