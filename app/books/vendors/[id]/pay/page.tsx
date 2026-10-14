'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BackLink, buttonClass, ErrorText, Field, messageOf, PageTitle, paymentOptions, SelectField, TextArea } from '@/components/merchant/ui';
import { blankToUndefined, getParty, listCategories, payVendor, todayKolkata } from '@/lib/merchant';
import type { Category } from '@/lib/types';

export default function PayVendorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [inactive, setInactive] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [date, setDate] = useState(todayKolkata());
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [categoryId, setCategoryId] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmInactive, setConfirmInactive] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    getParty('vendors', params.id).then((party) => {
      setName(party.name);
      setInactive(party.status === 'inactive');
    }).catch((caught: unknown) => setError(messageOf(caught)));
    listCategories('business', true).then(setCategories).catch(() => undefined);
  }, [params.id]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await payVendor(params.id, {
        amount: amount.trim(),
        date,
        paymentMethod: method,
        reference: blankToUndefined(reference),
        notes: blankToUndefined(notes),
        categoryId: blankToUndefined(categoryId),
        confirmInactive: confirmInactive || undefined,
      });
      router.push(`/books/vendors/${params.id}`);
    } catch (caught) {
      setError(messageOf(caught));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <BackLink href={`/books/vendors/${params.id}`}>Back to {name || 'vendor'}</BackLink>
      <PageTitle title="Vendor payment" />
      <Field label="Date" type="date" value={date} onChange={setDate} required />
      <Field label="Amount" value={amount} onChange={setAmount} required />
      <SelectField label="Payment method" value={method} onChange={setMethod} options={paymentOptions} />
      <SelectField
        label="Category"
        value={categoryId}
        onChange={setCategoryId}
        options={[{ value: '', label: 'No category' }, ...categories.map((category) => ({ value: category.id, label: category.name }))]}
      />
      <Field label="Reference" value={reference} onChange={setReference} />
      <TextArea label="Notes" value={notes} onChange={setNotes} />
      {inactive ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={confirmInactive} onChange={(event) => setConfirmInactive(event.target.checked)} />
          This vendor is inactive. Pay anyway.
        </label>
      ) : null}
      <ErrorText>{error}</ErrorText>
      <button type="submit" disabled={pending} className={buttonClass}>{pending ? 'Saving…' : 'Save payment'}</button>
    </form>
  );
}
