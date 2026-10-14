'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { StatusPill } from '@/components/status-pill';
import { ApiError, listMerchants, listSubscriptions } from '@/lib/api';
import type { Subscription, SubscriptionStatus } from '@/lib/types';

function SubscriptionsContent() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status') ?? '') as SubscriptionStatus | '';
  const [status, setStatus] = useState<SubscriptionStatus | ''>(initialStatus);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Subscription[]>([]);
  const [names, setNames] = useState<Record<string, { label: string; userId: string }>>({});
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus(initialStatus);
    setPage(1);
  }, [initialStatus]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listSubscriptions({ status, page }),
      listMerchants({ subscriptionStatus: status, page: 1 }),
    ])
      .then(([subscriptionPage, merchantPage]) => {
        if (cancelled) return;
        setItems(subscriptionPage.items);
        setTotal(subscriptionPage.total);
        const map: Record<string, { label: string; userId: string }> = {};
        for (const merchant of merchantPage.items) {
          if (merchant.business) {
            map[merchant.business.id] = {
              label: merchant.business.name,
              userId: merchant.user.id,
            };
          }
        }
        setNames(map);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof ApiError ? caught.message : 'Could not load subscriptions.');
      });
    return () => {
      cancelled = true;
    };
  }, [status, page]);

  const pageCount = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Subscriptions</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {(['', 'pending', 'active', 'expired', 'suspended'] as const).map((value) => (
          <button
            key={value || 'all'}
            type="button"
            onClick={() => {
              setPage(1);
              setStatus(value);
            }}
            className={`rounded-full px-3 py-1.5 text-sm ${
              status === value ? 'bg-[var(--green)] text-white' : 'bg-white text-[var(--ink)]'
            }`}
          >
            {value || 'All'}
          </button>
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      <ul className="mt-6 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--paper-2)]">
        {error ? null : items.length === 0 ? (
          <li className="px-4 py-6 text-sm text-[var(--muted)]">No subscriptions in this view.</li>
        ) : (
          items.map((subscription) => {
            const merchant = names[subscription.businessId];
            return (
              <li key={subscription.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                <div>
                  {merchant ? (
                    <Link href={`/admin/merchants/${merchant.userId}`} className="font-medium">
                      {merchant.label}
                    </Link>
                  ) : (
                    <p className="font-medium">Business {subscription.businessId.slice(-6)}</p>
                  )}
                  <p className="text-sm text-[var(--muted)]">
                    {subscription.startDate ?? 'No start'} → {subscription.endDate ?? 'No end date'}
                    {subscription.planName ? ` · ${subscription.planName}` : ''}
                  </p>
                </div>
                <StatusPill status={subscription.status} />
              </li>
            );
          })
        )}
      </ul>
      <div className="mt-4 flex items-center justify-between text-sm">
        <p className="text-[var(--muted)]">
          Page {page} of {pageCount}
        </p>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-[var(--line)] px-3 py-2 disabled:opacity-40">
            Previous
          </button>
          <button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-[var(--line)] px-3 py-2 disabled:opacity-40">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading subscriptions…</p>}>
      <SubscriptionsContent />
    </Suspense>
  );
}
