'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, getStoredUser, login, saveSession } from '@/lib/api';
import { SITE_HOST } from '@/lib/site';
import type { UserProfile } from '@/lib/types';

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const user = getStoredUser<UserProfile>();
    if (user?.role === 'admin') router.replace('/admin');
    if (user?.role === 'merchant') router.replace('/books');
  }, [router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      const session = await login(email.trim(), password);
      saveSession(session);
      router.push(session.user.role === 'admin' ? '/admin' : '/books');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Sign-in failed. Is the API running?');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex flex-col justify-between bg-[#0e3b2c] px-8 py-8 text-[#f3efe6] sm:px-14 lg:py-10">
        <div>
          <p className="text-sm tracking-[0.18em] text-[#d7c08a] uppercase">Green World Lighting</p>
          <h1 className="mt-4 max-w-xl font-[family-name:var(--font-display)] text-5xl leading-tight sm:text-6xl lg:mt-8">
            Entrybook
          </h1>
          <p className="mt-4 max-w-md text-lg text-[#d7e6de] lg:mt-6">
            Shop books for cash, sales, and dues. Administrators enable a subscription after payment.
          </p>
        </div>
        <p className="mt-6 text-sm text-[#b7cfc4] lg:mt-12">{SITE_HOST}</p>
      </section>
      <section className="flex items-center px-6 py-8 sm:px-12">
        <form onSubmit={onSubmit} className="mx-auto w-full max-w-md rounded-3xl bg-[var(--paper-2)] p-8 shadow-[var(--shadow)]">
          <h2 className="font-[family-name:var(--font-display)] text-3xl">Sign in</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Shop owners open their books here. Administrators manage subscriptions.
          </p>
          <label className="mt-8 block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--green)]"
          />
          <label className="mt-4 block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--green)]"
          />
          {error ? (
            <p className="mt-4 rounded-xl bg-[#f8e8e8] px-3 py-2 text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-xl bg-[var(--green)] px-4 py-3 font-medium text-white disabled:opacity-60"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
          <a href="/register" className="mt-4 block text-center text-sm text-[var(--green)]">
            Create a shop account
          </a>
        </form>
      </section>
    </main>
  );
}
