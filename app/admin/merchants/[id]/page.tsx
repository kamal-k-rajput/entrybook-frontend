'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StatusPill } from '@/components/status-pill';
import { activateSubscription, ApiError, getMerchant, setMerchantPassword, updateSubscription } from '@/lib/api';
import type { MerchantRecord, SubscriptionStatus } from '@/lib/types';

function blankToUndefined(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : undefined;
}

export default function MerchantDetailPage() {
  const params = useParams<{ id: string }>();
  const [merchant, setMerchant] = useState<MerchantRecord | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMerchant(params.id)
      .then((record) => {
        if (!cancelled) setMerchant(record);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof ApiError ? caught.message : 'Merchant not found.');
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function onActivate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!merchant?.business) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError('');
    setNotice('');
    try {
      const subscription = await activateSubscription(merchant.business.id, {
        endDate: String(data.get('endDate')),
        startDate: blankToUndefined(data.get('startDate')),
        planName: blankToUndefined(data.get('planName')),
        paymentReference: blankToUndefined(data.get('paymentReference')),
        amountPaid: blankToUndefined(data.get('amountPaid')),
        note: blankToUndefined(data.get('note')),
      });
      setMerchant({ ...merchant, subscription });
      setNotice(`Subscription is active until ${subscription.endDate}.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not activate the subscription.');
    } finally {
      setPending(false);
    }
  }

  async function onUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!merchant?.business) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError('');
    setNotice('');
    try {
      const subscription = await updateSubscription(merchant.business.id, {
        endDate: blankToUndefined(data.get('endDate')),
        status: blankToUndefined(data.get('status')) as SubscriptionStatus | undefined,
        planName: blankToUndefined(data.get('planName')),
        paymentReference: blankToUndefined(data.get('paymentReference')),
        note: blankToUndefined(data.get('note')),
      });
      setMerchant({ ...merchant, subscription });
      setNotice('Subscription updated.');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not update the subscription.');
    } finally {
      setPending(false);
    }
  }

  async function onPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!merchant) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get('password') ?? '');
    const confirm = String(data.get('confirm') ?? '');
    setError('');
    setNotice('');
    if (password.length < 6) {
      setError('Use at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setPasswordPending(true);
    try {
      await setMerchantPassword(merchant.user.id, password);
      form.reset();
      setNotice('Password updated. The shop must sign in with the new password.');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not set the password.');
    } finally {
      setPasswordPending(false);
    }
  }

  if (!merchant && !error) {
    return <p className="text-sm text-[var(--muted)]">Loading merchant…</p>;
  }

  return (
    <div>
      <Link href="/admin/merchants" className="text-sm text-[var(--green)]">
        Back to merchants
      </Link>
      {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
      {notice ? <p className="mt-4 text-sm text-[var(--green)]">{notice}</p> : null}
      {merchant ? (
        <>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-4xl">
                {merchant.business?.name ?? merchant.user.name}
              </h1>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {merchant.user.name} · {merchant.user.email}
                {merchant.user.phone ? ` · ${merchant.user.phone}` : ''}
              </p>
            </div>
            <StatusPill status={merchant.subscription?.status} />
          </div>
          <dl className="mt-6 grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-[var(--muted)]">Current end date</dt>
              <dd className="mt-1 text-lg">{merchant.subscription?.endDate ?? 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">Plan</dt>
              <dd className="mt-1 text-lg">{merchant.subscription?.planName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--muted)]">Last payment</dt>
              <dd className="mt-1 text-lg">{merchant.subscription?.amountPaid?.display ?? '—'}</dd>
            </div>
          </dl>

          <form onSubmit={onPassword} className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-5">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">Set a new password</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Use this when the shop has forgotten its password. Any password of 6 or more characters is accepted. They will need to sign in again.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="New password" name="password" type="password" required minLength={6} autoComplete="new-password" />
              <Field label="Confirm password" name="confirm" type="password" required minLength={6} autoComplete="new-password" />
            </div>
            <button type="submit" disabled={passwordPending} className="mt-5 rounded-xl bg-[var(--green)] px-4 py-3 text-white disabled:opacity-60">
              {passwordPending ? 'Saving…' : 'Set password'}
            </button>
          </form>

          <form onSubmit={onActivate} className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-5">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">Enable after payment</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Use this when the payment has been received. The end date is inclusive.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="End date" name="endDate" type="date" required defaultValue={merchant.subscription?.endDate ?? ''} />
              <Field label="Start date" name="startDate" type="date" defaultValue={merchant.subscription?.startDate ?? ''} />
              <Field label="Amount received (₹)" name="amountPaid" placeholder="4999.00" />
              <Field label="Payment reference" name="paymentReference" placeholder="NEFT-123" />
              <Field label="Plan name" name="planName" placeholder="annual" />
              <Field label="Note" name="note" placeholder="Payment received in the bank" />
            </div>
            <button type="submit" disabled={pending || !merchant.business} className="mt-5 rounded-xl bg-[var(--green)] px-4 py-3 text-white disabled:opacity-60">
              {pending ? 'Saving…' : 'Activate subscription'}
            </button>
          </form>

          <form onSubmit={onUpdate} className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-5">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">Change end date or status</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="New end date" name="endDate" type="date" defaultValue={merchant.subscription?.endDate ?? ''} />
              <label className="block text-sm">
                Status
                <select name="status" defaultValue={merchant.subscription?.status ?? ''} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3">
                  <option value="">Keep current</option>
                  <option value="active">active</option>
                  <option value="suspended">suspended</option>
                  <option value="expired">expired</option>
                  <option value="pending">pending</option>
                </select>
              </label>
              <Field label="Plan name" name="planName" defaultValue={merchant.subscription?.planName ?? ''} />
              <Field label="Payment reference" name="paymentReference" defaultValue={merchant.subscription?.paymentReference ?? ''} />
              <Field label="Note" name="note" defaultValue={merchant.subscription?.note ?? ''} />
            </div>
            <button type="submit" disabled={pending || !merchant.business} className="mt-5 rounded-xl border border-[var(--green)] px-4 py-3 text-[var(--green)] disabled:opacity-60">
              Save changes
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  placeholder,
  defaultValue,
  minLength,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  minLength?: number;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        minLength={minLength}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3"
      />
    </label>
  );
}
