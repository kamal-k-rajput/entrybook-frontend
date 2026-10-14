'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BackLink, buttonClass, ErrorText, Field, messageOf, PageTitle, paymentOptions, SelectField, TextArea } from '@/components/merchant/ui';
import { blankToUndefined, createReceipt, getDues, getParty, todayKolkata } from '@/lib/merchant';

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [inactive, setInactive] = useState(false);
  const [date, setDate] = useState(todayKolkata());
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [allowAdvance, setAllowAdvance] = useState(false);
  const [confirmInactive, setConfirmInactive] = useState(false);
  const [choose, setChoose] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [invoices, setInvoices] = useState<{ saleId: string; invoiceNumber: string | null; remaining: { rupees: string; display: string } }[]>([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    getParty('customers', params.id).then((party) => {
      setName(party.name);
      setInactive(party.status === 'inactive');
    }).catch((caught: unknown) => setError(messageOf(caught)));
    getDues({ period: 'this_month' }).then((dues) => {
      setInvoices(dues.invoices.filter((invoice) => invoice.customerId === params.id));
    }).catch(() => undefined);
  }, [params.id]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    const allocations = choose
      ? Object.entries(selected).filter(([, value]) => value.trim()).map(([saleId, value]) => ({ saleId, amount: value.trim() }))
      : undefined;
    try {
      await createReceipt(params.id, {
        amount: amount.trim(),
        date,
        paymentMethod: method,
        reference: blankToUndefined(reference),
        notes: blankToUndefined(notes),
        allowAdvance: allowAdvance || undefined,
        confirmInactive: confirmInactive || undefined,
        allocations: allocations && allocations.length > 0 ? allocations : undefined,
      });
      router.push(`/books/customers/${params.id}`);
    } catch (caught) {
      setError(messageOf(caught));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <BackLink href={`/books/customers/${params.id}`}>Back to {name || 'customer'}</BackLink>
      <PageTitle title="Receipt" text="If you don’t choose invoices, the receipt is applied to the oldest open sales." />
      <Field label="Date" type="date" value={date} onChange={setDate} required />
      <Field label="Amount" value={amount} onChange={setAmount} required />
      <SelectField label="Payment method" value={method} onChange={setMethod} options={paymentOptions} />
      <Field label="Reference" value={reference} onChange={setReference} />
      <TextArea label="Notes" value={notes} onChange={setNotes} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={allowAdvance} onChange={(event) => setAllowAdvance(event.target.checked)} />
        Allow more than the outstanding balance
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={choose} onChange={(event) => setChoose(event.target.checked)} />
        Choose invoices
      </label>
      {choose ? invoices.map((invoice) => (
        <label key={invoice.saleId} className="block text-sm">
          {invoice.invoiceNumber ?? 'Sale'} · remaining {invoice.remaining.display}
          <input
            value={selected[invoice.saleId] ?? ''}
            placeholder={invoice.remaining.rupees}
            onChange={(event) => setSelected((current) => ({ ...current, [invoice.saleId]: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
          />
        </label>
      )) : null}
      {inactive ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={confirmInactive} onChange={(event) => setConfirmInactive(event.target.checked)} />
          This customer is inactive. Record anyway.
        </label>
      ) : null}
      <ErrorText>{error}</ErrorText>
      <button type="submit" disabled={pending} className={buttonClass}>{pending ? 'Saving…' : 'Save receipt'}</button>
    </form>
  );
}
