'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { buttonClass, ErrorText, formatDay, messageOf, PageTitle, paymentLabel, PeriodBar, SelectField, usePeriod } from '@/components/merchant/ui';
import { downloadTransactions, listTransactions } from '@/lib/merchant';
import type { LedgerTransaction } from '@/lib/types';

const types = [
  { value: '', label: 'All types' },
  { value: 'customer_receipt', label: 'Receipts' },
  { value: 'vendor_payment', label: 'Vendor payments' },
  { value: 'business_expense', label: 'Business expenses' },
  { value: 'personal_expense', label: 'Personal expenses' },
];

export default function CashPage() {
  const period = usePeriod();
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<LedgerTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    setPage(1);
  }, [period.period, period.from, period.to, type, status, query]);

  useEffect(() => {
    if (!period.ready) return;
    let cancelled = false;
    const handle = window.setTimeout(() => {
      listTransactions({ ...period.filters, type, status, q: query, page })
        .then((result) => {
          if (cancelled) return;
          setItems((current) => (page === 1 ? result.items : [...current, ...result.items]));
          setTotal(result.total);
          setError('');
        })
        .catch((caught: unknown) => {
          if (!cancelled) setError(messageOf(caught));
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [period.ready, period.period, period.from, period.to, type, status, query, page]);

  async function exportCsv() {
    try {
      const blob = await downloadTransactions({ ...period.filters, type, status, q: query });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'entrybook-transactions.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(messageOf(caught));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle title="Cash book" text="Posted receipts, vendor payments, and expenses. Reversed rows stay in history." />
        <div className="flex gap-3">
          <Link href="/books/expenses/new" className={buttonClass}>Expense</Link>
          <button type="button" onClick={exportCsv} className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm">Export CSV</button>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <PeriodBar period={period.period} from={period.from} to={period.to} onPeriod={period.setPeriod} onFrom={period.setFrom} onTo={period.setTo} />
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectField label="Type" value={type} onChange={setType} options={types} />
          <SelectField label="Status" value={status} onChange={setStatus} options={[{ value: '', label: 'All' }, { value: 'posted', label: 'Posted' }, { value: 'reversed', label: 'Reversed' }]} />
          <label className="block text-sm font-medium">
            Reference or notes
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5" />
          </label>
        </div>
      </div>
      <ErrorText>{error}</ErrorText>
      <ul className="mt-4 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--paper-2)]">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={`/books/cash/${item.id}`} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span>
                {formatDay(item.date)} · {item.type.replaceAll('_', ' ')}
                <span className="block text-[var(--muted)]">{[item.partyName, paymentLabel(item.paymentMethod), item.status].filter(Boolean).join(' · ')}</span>
              </span>
              <span className={item.direction === 'in' ? 'text-[var(--green)]' : ''}>{item.amount.display}</span>
            </Link>
          </li>
        ))}
      </ul>
      {items.length < total ? (
        <button type="button" className="mt-4 text-sm text-[var(--green)]" onClick={() => setPage((value) => value + 1)}>Load more</button>
      ) : null}
    </div>
  );
}
