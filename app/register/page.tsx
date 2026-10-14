'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ApiError, saveSession } from '@/lib/api';
import { registerMerchant } from '@/lib/merchant';
import { SITE_HOST } from '@/lib/site';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [usage, setUsage] = useState<'personal' | 'shop'>('personal');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const session = await registerMerchant({
        name: name.trim(),
        businessName: usage === 'shop' ? businessName.trim() : undefined,
        usage,
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
      saveSession(session);
      router.push('/books');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not create the account.');
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="bg-[#0e3b2c] px-8 py-10 text-[#f3efe6] sm:px-14">
        <p className="text-sm tracking-[0.18em] text-[#d7c08a] uppercase">Green World Lighting</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl">Entrybook</h1>
        <p className="mt-4 max-w-md text-lg text-[#d7e6de]">Personal use includes one year. A new shop includes six months. An administrator can extend the end date later.</p>
        <p className="mt-10 text-sm text-[#b7cfc4]">{SITE_HOST}</p>
      </section>
      <section className="flex items-center px-6 py-8">
        <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-4 rounded-3xl bg-[var(--paper-2)] p-8 shadow-[var(--shadow)]">
          <h2 className="font-[family-name:var(--font-display)] text-3xl">Create an account</h2>
          <div className="flex gap-2 text-sm">
            <button type="button" onClick={() => setUsage('personal')} className={`rounded-xl px-3 py-2 ${usage === 'personal' ? 'bg-[var(--green)] text-white' : 'border border-[var(--line)]'}`}>Personal</button>
            <button type="button" onClick={() => setUsage('shop')} className={`rounded-xl px-3 py-2 ${usage === 'shop' ? 'bg-[var(--green)] text-white' : 'border border-[var(--line)]'}`}>Shop owner</button>
          </div>
          <p className="text-xs text-[var(--muted)]">{usage === 'personal' ? 'Friends, family, and personal expenses. One year is included.' : 'Shop books. Six months are included for a new shop.'}</p>
          <label className="block text-sm font-medium">Your name<input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-3" /></label>
          {usage === 'shop' ? <label className="block text-sm font-medium">Shop name<input required minLength={2} value={businessName} onChange={(event) => setBusinessName(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-3" /></label> : null}
          <label className="block text-sm font-medium">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-3" /></label>
          <label className="block text-sm font-medium">Phone<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-3" /></label>
          <label className="block text-sm font-medium">Password<input required type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-3" /></label>
          <p className="text-xs text-[var(--muted)]">At least 6 characters.</p>
          {error ? <p className="rounded-xl bg-[#f8e8e8] px-3 py-2 text-sm text-[var(--danger)]">{error}</p> : null}
          <button type="submit" disabled={pending} className="w-full rounded-xl bg-[var(--green)] px-4 py-3 font-medium text-white disabled:opacity-60">{pending ? 'Creating…' : 'Create account'}</button>
          <Link href="/" className="block text-center text-sm text-[var(--green)]">Back to sign in</Link>
        </form>
      </section>
    </main>
  );
}
