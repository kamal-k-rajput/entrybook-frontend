'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { usePartyStatus } from '@/components/merchant/parties';
import { buttonClass, ErrorText, formatDay, messageOf, MoneyCard, PageTitle } from '@/components/merchant/ui';
import { getCustomerLedger, getParty } from '@/lib/merchant';
import type { Money, Party } from '@/lib/types';

export default function CustomerPage() {
  const params = useParams<{ id: string }>();
  const [party, setParty] = useState<Party | null>(null);
  const [outstanding, setOutstanding] = useState<Money | null>(null);
  const [entries, setEntries] = useState<{ id: string; date: string; description: string; amount: Money; balance: Money }[]>([]);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((value) => value + 1), []);
  const status = usePartyStatus('customers', party, reload);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getParty('customers', params.id), getCustomerLedger(params.id, { period: 'this_month' })])
      .then(([nextParty, ledger]) => {
        if (cancelled) return;
        setParty(nextParty);
        setOutstanding(ledger.outstanding);
        setEntries(ledger.entries);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(messageOf(caught));
      });
    return () => {
      cancelled = true;
    };
  }, [params.id, tick]);

  if (!party) {
    return error ? <ErrorText>{error}</ErrorText> : <p className="text-sm text-[var(--muted)]">Loading customer…</p>;
  }

  return (
    <div className="max-w-3xl">
      <PageTitle title={party.name} text={party.status === 'inactive' ? 'Inactive' : 'Active'} />
      {outstanding ? <div className="mt-6"><MoneyCard label="Outstanding" money={outstanding} note="Opening receivable plus sales, minus receipts." /></div> : null}
      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-[var(--muted)]">Phone</dt><dd>{party.phone ?? '—'}</dd></div>
        <div><dt className="text-[var(--muted)]">Code</dt><dd>{party.code ?? '—'}</dd></div>
        <div><dt className="text-[var(--muted)]">Business</dt><dd>{party.businessName ?? '—'}</dd></div>
        <div><dt className="text-[var(--muted)]">Opening</dt><dd>{party.openingBalance.display}</dd></div>
      </dl>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/books/customers/${party.id}/sale`} className={buttonClass}>New sale</Link>
        <Link href={`/books/customers/${party.id}/receipt`} className={buttonClass}>Receipt</Link>
        <Link href={`/books/customers/${party.id}/statement`} className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm">Statement</Link>
        <Link href={`/books/customers/${party.id}/edit`} className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm">Edit</Link>
        <button type="button" className="text-sm text-[var(--green)]" onClick={status.toggle}>
          {party.status === 'active' ? 'Mark inactive' : 'Mark active'}
        </button>
      </div>
      <ErrorText>{status.error}</ErrorText>
      <h2 className="mt-8 font-[family-name:var(--font-display)] text-2xl">This month</h2>
      <ul className="mt-3 divide-y divide-[var(--line)]">
        {entries.length === 0 ? <li className="py-3 text-sm text-[var(--muted)]">No sales or receipts this month.</li> : null}
        {entries.map((entry) => (
          <li key={`${entry.id}-${entry.date}`} className="flex justify-between gap-4 py-3 text-sm">
            <span>{formatDay(entry.date)} · {entry.description}</span>
            <span>{entry.amount.display} · {entry.balance.display}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
