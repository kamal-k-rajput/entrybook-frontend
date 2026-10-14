'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BackLink, buttonClass, ErrorText, Field, messageOf, PageTitle, paymentOptions, SelectField, TextArea } from '@/components/merchant/ui';
import { useMerchant } from '@/components/merchant/shell';
import { blankToUndefined, createExpense, listCategories, todayKolkata } from '@/lib/merchant';
import type { Category } from '@/lib/types';

export default function ExpensePage() {
  const router = useRouter();
  const account = useMerchant();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenseType, setExpenseType] = useState<'business' | 'personal'>(account?.user.usage === 'personal' ? 'personal' : 'business');
  const [date, setDate] = useState(todayKolkata());
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const matching = categories.filter((category) => category.expenseType === expenseType && category.active);

  useEffect(() => {
    listCategories(undefined, true).then(setCategories).catch((caught: unknown) => setError(messageOf(caught)));
  }, []);

  useEffect(() => {
    if (!matching.some((category) => category.id === categoryId)) {
      setCategoryId(matching[0]?.id ?? '');
    }
  }, [expenseType, categories]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await createExpense({
        expenseType,
        amount: amount.trim(),
        date,
        categoryId,
        paymentMethod: method,
        notes: blankToUndefined(notes),
      });
      router.push('/books/cash');
    } catch (caught) {
      setError(messageOf(caught));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <BackLink href="/books/cash">Back to cash book</BackLink>
      <PageTitle title="Expense" text="Personal expenses stay out of business operating totals and still count as cash out." />
      <div className="flex gap-2">
        <button type="button" className={expenseType === 'business' ? buttonClass : 'rounded-xl border px-4 py-2 text-sm'} onClick={() => setExpenseType('business')}>Business</button>
        <button type="button" className={expenseType === 'personal' ? buttonClass : 'rounded-xl border px-4 py-2 text-sm'} onClick={() => setExpenseType('personal')}>Personal</button>
      </div>
      <Field label="Date" type="date" value={date} onChange={setDate} required />
      <Field label="Amount" value={amount} onChange={setAmount} required />
      <SelectField label="Payment method" value={method} onChange={setMethod} options={paymentOptions} />
      <SelectField label="Category" value={categoryId} onChange={setCategoryId} options={matching.map((category) => ({ value: category.id, label: category.name }))} />
      <TextArea label="Notes" value={notes} onChange={setNotes} />
      <ErrorText>{error}</ErrorText>
      <button type="submit" disabled={pending || !categoryId} className={buttonClass}>{pending ? 'Saving…' : 'Save expense'}</button>
    </form>
  );
}
