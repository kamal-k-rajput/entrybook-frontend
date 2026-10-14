'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { usePartyStatus } from '@/components/merchant/parties';
import { buttonClass, ErrorText, formatDay, messageOf, MoneyCard, PageTitle, paymentLabel } from '@/components/merchant/ui';
import { getParty, getVendorLedger } from '@/lib/merchant';
import type { Money, Party } from '@/lib/types';

export default function VendorPage() {
  const params = useParams<{ id: string }>();
  const [party, setParty] = useState<Party | null>(null);
  const [payable, setPayable] = useState<Money | null>(null);
  const [paidInPeriod, setPaidInPeriod] = useState<Money | null>(null);
  const [paidTillDate, setPaidTillDate] = useState<Money | null>(null);
  const [payments, setPayments] = useState<{ id: string; date: string; amount: Money; paymentMethod: string; status: string }[]>([]);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((value) => value + 1), []);
  const status = usePartyStatus('vendors', party, reload);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getParty('vendors', params.id), getVendorLedger(params.id, { period: 'this_month' })])
      .then(([next, ledger]) => {
        if (cancelled) return;
        setParty(next);
        setPayable(ledger.summary.payable);
        setPaidInPeriod(ledger.summary.paidInPeriod);
        setPaidTillDate(ledger.summary.paidTillDate);
        setPayments(ledger.transactions);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(messageOf(caught));
      });
    return () => {
      cancelled = true;
    };
  }, [params.id, tick]);

  if (!party) return error ? <ErrorText>{error}</ErrorText> : <p className="text-sm text-[var(--muted)]">Loading vendor…</p>;

  return (
    <div className="max-w-3xl">
      <PageTitle title={party.name} text={party.status === 'inactive' ? 'Inactive' : 'Active'} />
      {payable ? (
        <div className="mt-6">
          <MoneyCard label="Payable" money={payable} note="Opening payable minus posted payments. Vendor bills are not in this book." />
        </div>
      ) : null}
      <p className="mt-4 text-sm text-[var(--muted)]">
        Paid this month {paidInPeriod?.display ?? '—'} · Paid till date {paidTillDate?.display ?? '—'}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/books/vendors/${party.id}/pay`} className={buttonClass}>Record payment</Link>
        <Link href={`/books/vendors/${party.id}/edit`} className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm">Edit</Link>
        <button type="button" className="text-sm text-[var(--green)]" onClick={status.toggle}>
          {party.status === 'active' ? 'Mark inactive' : 'Mark active'}
        </button>
      </div>
      <ErrorText>{status.error}</ErrorText>
      <h2 className="mt-8 font-[family-name:var(--font-display)] text-2xl">Payments this month</h2>
      <ul className="mt-3 divide-y divide-[var(--line)]">
        {payments.length === 0 ? <li className="py-3 text-sm text-[var(--muted)]">No payments this month.</li> : null}
        {payments.map((payment) => (
          <li key={payment.id} className="flex justify-between py-3 text-sm">
            <span>{formatDay(payment.date)} · {paymentLabel(payment.paymentMethod)} · {payment.status}</span>
            <span>{payment.amount.display}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
