'use client';

import { useEffect, useState } from 'react';
import { useMerchant } from '@/components/merchant/shell';
import { buttonClass, ErrorText, Field, formatDay, messageOf, PageTitle } from '@/components/merchant/ui';
import { getBusiness, updateBusiness } from '@/lib/merchant';

export default function BusinessPage() {
  const account = useMerchant();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    getBusiness().then((business) => {
      setName(business.name);
      setPhone(business.phone ?? '');
      setAddress(business.address ?? '');
      setCurrency(business.currency);
      setTimezone(business.timezone);
    }).catch((caught: unknown) => setError(messageOf(caught)));
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    setSaved('');
    try {
      await updateBusiness({ name: name.trim(), phone: phone.trim(), address: address.trim() });
      setSaved('Saved.');
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <PageTitle title="Business" text="Currency stays INR. The timezone stays with the shop." />
      <Field label="Shop name" value={name} onChange={setName} required />
      <Field label="Phone" value={phone} onChange={setPhone} />
      <Field label="Address" value={address} onChange={setAddress} />
      <p className="text-sm text-[var(--muted)]">Currency {currency} · Timezone {timezone}</p>
      {account?.subscription ? (
        <p className="text-sm">
          Subscription {account.subscription.status}
          {account.subscription.endDate ? ` · ends ${formatDay(account.subscription.endDate)}` : ''}
        </p>
      ) : null}
      <ErrorText>{error}</ErrorText>
      {saved ? <p className="text-sm text-[var(--green)]">{saved}</p> : null}
      <button type="submit" disabled={pending} className={buttonClass}>{pending ? 'Saving…' : 'Save'}</button>
    </form>
  );
}
