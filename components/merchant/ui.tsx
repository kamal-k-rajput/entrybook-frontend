'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { ApiError } from '@/lib/api';
import { todayKolkata, type PeriodQuery } from '@/lib/merchant';
import type { Money } from '@/lib/types';

export const fieldClass =
  'mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--green)]';

export const buttonClass =
  'rounded-xl bg-[var(--green)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60';

export function messageOf(caught: unknown): string {
  if (caught instanceof ApiError) return caught.message;
  if (caught instanceof Error && caught.message) return caught.message;
  return 'Something went wrong.';
}

export function PageTitle({ title, text }: { title: string; text?: string }) {
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-4xl">{title}</h1>
      {text ? <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{text}</p> : null}
    </div>
  );
}

export function ErrorText({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p className="rounded-xl bg-[#f8e8e8] px-3 py-2 text-sm text-[var(--danger)]" role="alert">
      {children}
    </p>
  );
}

export function MoneyCard({ label, money, note }: { label: string; money: Money; note?: string }) {
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{money.display}</p>
      {note ? <p className="mt-2 text-xs text-[var(--muted)]">{note}</p> : null}
    </article>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      />
    </label>
  );
}

export function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass} rows={3} />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const periods = [
  ['today', 'Today'],
  ['this_week', 'This week'],
  ['this_month', 'This month'],
  ['previous_month', 'Last month'],
  ['custom', 'Custom'],
] as const;

export function usePeriod() {
  const [period, setPeriod] = useState('this_month');
  const [from, setFrom] = useState(todayKolkata());
  const [to, setTo] = useState(todayKolkata());
  const ready = period !== 'custom' || (from !== '' && to !== '' && from <= to);
  const filters: PeriodQuery = {
    period,
    from: period === 'custom' ? from : undefined,
    to: period === 'custom' ? to : undefined,
  };
  return { period, setPeriod, from, setFrom, to, setTo, ready, filters };
}

export function PeriodBar({
  period,
  from,
  to,
  onPeriod,
  onFrom,
  onTo,
}: {
  period: string;
  from: string;
  to: string;
  onPeriod: (value: string) => void;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      {periods.map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onPeriod(value)}
          className={`rounded-full px-3 py-1.5 text-sm ${
            period === value ? 'bg-[var(--green)] text-white' : 'bg-white text-[var(--ink)]'
          }`}
        >
          {label}
        </button>
      ))}
      {period === 'custom' ? (
        <>
          <Field label="From" type="date" value={from} onChange={onFrom} />
          <Field label="To" type="date" value={to} onChange={onTo} />
        </>
      ) : null}
    </div>
  );
}

export function formatDay(value?: string | null): string {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function paymentLabel(method: string): string {
  return (
    {
      cash: 'Cash',
      upi: 'UPI',
      bank_transfer: 'Bank transfer',
      card: 'Card',
      cheque: 'Cheque',
      other: 'Other',
    }[method] ?? method
  );
}

export const paymentOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-sm text-[var(--green)]">
      {children}
    </Link>
  );
}

export function useFormError() {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function run(event: FormEvent | undefined, action: () => Promise<void>) {
    event?.preventDefault();
    setError('');
    setPending(true);
    try {
      await action();
    } catch (caught) {
      setError(messageOf(caught));
      setPending(false);
    }
  }
  return { error, pending, run, setError };
}

export function LoadNote({ text }: { text: string }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    setShow(true);
  }, [text]);
  if (!show) return null;
  return <p className="text-sm text-[var(--muted)]">{text}</p>;
}
