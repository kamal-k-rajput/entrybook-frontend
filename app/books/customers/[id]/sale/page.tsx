'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BackLink, buttonClass, ErrorText, Field, messageOf, PageTitle, paymentOptions, SelectField, TextArea } from '@/components/merchant/ui';
import { blankToUndefined, createSale, getParty, todayKolkata } from '@/lib/merchant';

export default function SalePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [inactive, setInactive] = useState(false);
  const [date, setDate] = useState(todayKolkata());
  const [amount, setAmount] = useState('');
  const [discount, setDiscount] = useState('');
  const [invoice, setInvoice] = useState('');
  const [due, setDue] = useState('');
  const [notes, setNotes] = useState('');
  const [receipt, setReceipt] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [allowAdvance, setAllowAdvance] = useState(false);
  const [confirmInactive, setConfirmInactive] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    getParty('customers', params.id).then((party) => {
      setName(party.name);
      setInactive(party.status === 'inactive');
    }).catch((caught: unknown) => setError(messageOf(caught)));
  }, [params.id]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const created = await createSale(params.id, {
        date,
        amount: amount.trim(),
        discount: blankToUndefined(discount),
        invoiceNumber: blankToUndefined(invoice),
        dueDate: blankToUndefined(due),
        notes: blankToUndefined(notes),
        confirmInactive: confirmInactive || undefined,
        allowAdvance: allowAdvance || undefined,
        initialReceipt: receipt ? { amount: receiptAmount.trim(), date, paymentMethod: method } : undefined,
      });
      router.push(`/books/sales/${created.sale.id}`);
    } catch (caught) {
      setError(messageOf(caught));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <BackLink href={`/books/customers/${params.id}`}>Back to {name || 'customer'}</BackLink>
      <PageTitle title="New sale" text="A sale is not cash received. Record a receipt for money that came in." />
      <Field label="Date" type="date" value={date} onChange={setDate} required />
      <Field label="Amount" value={amount} onChange={setAmount} required />
      <Field label="Discount" value={discount} onChange={setDiscount} />
      <Field label="Invoice number" value={invoice} onChange={setInvoice} />
      <Field label="Due date" type="date" value={due} onChange={setDue} />
      <TextArea label="Notes" value={notes} onChange={setNotes} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={receipt} onChange={(event) => setReceipt(event.target.checked)} />
        Record an initial receipt
      </label>
      {receipt ? (
        <>
          <Field label="Receipt amount" value={receiptAmount} onChange={setReceiptAmount} required />
          <SelectField label="Payment method" value={method} onChange={setMethod} options={paymentOptions} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allowAdvance} onChange={(event) => setAllowAdvance(event.target.checked)} />
            Allow a receipt above the amount due
          </label>
        </>
      ) : null}
      {inactive ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={confirmInactive} onChange={(event) => setConfirmInactive(event.target.checked)} />
          This customer is inactive. Record anyway.
        </label>
      ) : null}
      <ErrorText>{error}</ErrorText>
      <button type="submit" disabled={pending} className={buttonClass}>{pending ? 'Saving…' : 'Save sale'}</button>
    </form>
  );
}
