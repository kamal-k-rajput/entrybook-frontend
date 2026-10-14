'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BackLink, buttonClass, ErrorText, formatDay, messageOf, PageTitle, paymentLabel } from '@/components/merchant/ui';
import { getTransaction, reverseTransaction } from '@/lib/merchant';
import type { LedgerTransaction } from '@/lib/types';

export default function TransactionPage() {
  const params = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<LedgerTransaction | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    getTransaction(params.id).then(setTransaction).catch((caught: unknown) => setError(messageOf(caught)));
  }, [params.id]);

  async function reverse() {
    setPending(true);
    setError('');
    try {
      setTransaction(await reverseTransaction(params.id, reason.trim()));
      setReason('');
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      setPending(false);
    }
  }

  if (!transaction) return error ? <ErrorText>{error}</ErrorText> : <p className="text-sm text-[var(--muted)]">Loading…</p>;

  return (
    <div className="max-w-xl">
      <BackLink href="/books/cash">Back to cash book</BackLink>
      <div className="mt-4">
        <PageTitle title={transaction.amount.display} text={transaction.type.replaceAll('_', ' ')} />
      </div>
      <dl className="mt-6 space-y-2 text-sm">
        <div>Date: {formatDay(transaction.date)}</div>
        <div>Method: {paymentLabel(transaction.paymentMethod)}</div>
        <div>Status: {transaction.status}</div>
        {transaction.partyName ? <div>Party: {transaction.partyName}</div> : null}
        {transaction.reference ? <div>Reference: {transaction.reference}</div> : null}
        {transaction.notes ? <div>Notes: {transaction.notes}</div> : null}
        {transaction.reversalReason ? <div>Reversal: {transaction.reversalReason}</div> : null}
      </dl>
      {transaction.status === 'posted' ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-[var(--muted)]">Reversing keeps the row and drops it from totals. A reversed receipt clears its sale allocations.</p>
          <label className="block text-sm font-medium">
            Reason
            <input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5" />
          </label>
          <button type="button" disabled={pending || reason.trim().length < 3} onClick={reverse} className={buttonClass}>
            {pending ? 'Reversing…' : 'Reverse'}
          </button>
        </div>
      ) : null}
      <div className="mt-4"><ErrorText>{error}</ErrorText></div>
    </div>
  );
}
