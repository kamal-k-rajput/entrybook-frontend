'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { buttonClass, ErrorText, formatDay, messageOf, PageTitle } from '@/components/merchant/ui';
import { getSale, voidSale } from '@/lib/merchant';
import type { Sale } from '@/lib/types';

export default function SaleDetailPage() {
  const params = useParams<{ id: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    getSale(params.id).then(setSale).catch((caught: unknown) => setError(messageOf(caught)));
  }, [params.id]);

  async function voidThis() {
    setPending(true);
    setError('');
    try {
      setSale(await voidSale(params.id, reason.trim()));
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      setPending(false);
    }
  }

  if (!sale) return error ? <ErrorText>{error}</ErrorText> : <p className="text-sm text-[var(--muted)]">Loading sale…</p>;

  return (
    <div className="max-w-xl">
      <PageTitle title={sale.invoiceNumber ?? 'Sale'} text={sale.status} />
      <dl className="mt-6 space-y-2 text-sm">
        <div>Date: {formatDay(sale.date)}</div>
        <div>Gross: {sale.grossAmount.display}</div>
        <div>Discount: {sale.discount.display}</div>
        <div>Net: {sale.netAmount.display}</div>
        {sale.allocated ? <div>Allocated: {sale.allocated.display}</div> : null}
        {sale.remaining ? <div>Remaining: {sale.remaining.display}</div> : null}
        {sale.dueDate ? <div>Due: {formatDay(sale.dueDate)}</div> : null}
        {sale.notes ? <div>Notes: {sale.notes}</div> : null}
        {sale.voidReason ? <div>Void reason: {sale.voidReason}</div> : null}
      </dl>
      {sale.status !== 'void' ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-[var(--muted)]">Void a sale only after its receipts are reversed.</p>
          <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5" />
          <button type="button" disabled={pending || reason.trim().length < 3} onClick={voidThis} className={buttonClass}>Void sale</button>
        </div>
      ) : null}
      <div className="mt-4"><ErrorText>{error}</ErrorText></div>
    </div>
  );
}
