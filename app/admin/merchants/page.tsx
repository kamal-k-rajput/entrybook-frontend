'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { StatusPill } from '@/components/status-pill';
import { ApiError, listMerchants } from '@/lib/api';
import type { MerchantRecord, SubscriptionStatus } from '@/lib/types';

const statuses: Array<SubscriptionStatus | ''> = ['', 'pending', 'active', 'expired', 'suspended'];

export default function MerchantsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus | ''>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<MerchantRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listMerchants({ q, subscriptionStatus: status, page })
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof ApiError ? caught.message : 'Could not load merchants.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, status, page]);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPage(1);
    setQ(String(data.get('q') ?? ''));
    setStatus(String(data.get('status') ?? '') as SubscriptionStatus | '');
  }

  const pageCount = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Merchants</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Search by name, email, or phone, then open a shop to set its subscription.</p>
      <form onSubmit={onSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search merchants"
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-3 sm:flex-1"
        />
        <select name="status" defaultValue={status} className="rounded-xl border border-[var(--line)] bg-white px-3 py-3">
          {statuses.map((value) => (
            <option key={value || 'all'} value={value}>
              {value ? value : 'All statuses'}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-xl bg-[var(--green)] px-4 py-3 text-white">
          Search
        </button>
      </form>
      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--paper-2)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--line)] text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">End date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-[var(--muted)]" colSpan={4}>
                  Loading merchants…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-[var(--muted)]" colSpan={4}>
                  No merchants match this search.
                </td>
              </tr>
            ) : (
              items.map((merchant) => (
                <tr key={merchant.user.id} className="border-t border-[var(--line)]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/merchants/${merchant.user.id}`} className="font-medium text-[var(--green-deep)]">
                      {merchant.business?.name ?? 'No business'}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{merchant.user.name}</div>
                    <div className="text-[var(--muted)]">{merchant.user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={merchant.subscription?.status} />
                  </td>
                  <td className="px-4 py-3">{merchant.subscription?.endDate ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
