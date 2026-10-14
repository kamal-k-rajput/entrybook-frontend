'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BackLink,
  buttonClass,
  ErrorText,
  Field,
  messageOf,
  PageTitle,
  TextArea,
} from '@/components/merchant/ui';
import {
  blankToUndefined,
  createParty,
  getParty,
  listParties,
  setPartyStatus,
  updateParty,
  type PartyInput,
} from '@/lib/merchant';
import type { Party } from '@/lib/types';

export function PartyList({ kind }: { kind: 'customer' | 'vendor' }) {
  const path = kind === 'customer' ? 'customers' : 'vendors';
  const noun = kind === 'customer' ? 'customer' : 'vendor';
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Party[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      listParties(path, { q: query, status: status || undefined, page })
        .then((result) => {
          if (cancelled) return;
          setItems((current) => (page === 1 ? result.items : [...current, ...result.items]));
          setTotal(result.total);
          setError('');
        })
        .catch((caught: unknown) => {
          if (!cancelled) setError(messageOf(caught));
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [path, query, status, page]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle title={kind === 'customer' ? 'Customers' : 'Vendors'} text="Parties are marked inactive. They are not deleted." />
        <Link href={`/books/${path}/new`} className={buttonClass}>
          New {noun}
        </Link>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(event) => {
            setPage(1);
            setQuery(event.target.value);
          }}
          placeholder="Search name, phone, or code"
          className="w-full max-w-sm rounded-xl border border-[var(--line)] bg-white px-3 py-2.5"
        />
        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <ErrorText>{error}</ErrorText>
      <ul className="mt-4 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--paper-2)]">
        {items.length === 0 ? <li className="px-4 py-6 text-sm text-[var(--muted)]">No {noun}s yet.</li> : null}
        {items.map((party) => (
          <li key={party.id}>
            <Link href={`/books/${path}/${party.id}`} className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <p className="font-medium">{party.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  {[party.phone, party.code, party.businessName].filter(Boolean).join(' · ') || 'No phone or code'}
                </p>
              </div>
              <div className="text-right text-sm">
                {party.status === 'inactive' ? <p className="text-[var(--muted)]">Inactive</p> : null}
                {party.openingBalance.paise !== 0 ? <p>{party.openingBalance.display}</p> : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {items.length < total ? (
        <button type="button" className="mt-4 text-sm text-[var(--green)]" onClick={() => setPage((value) => value + 1)}>
          Load more
        </button>
      ) : null}
    </div>
  );
}

export function PartyForm({ kind, id }: { kind: 'customer' | 'vendor'; id?: string }) {
  const path = kind === 'customer' ? 'customers' : 'vendors';
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [code, setCode] = useState('');
  const [notes, setNotes] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!id) return;
    getParty(path, id)
      .then((party) => {
        setName(party.name);
        setPhone(party.phone ?? '');
        setBusinessName(party.businessName ?? '');
        setAddress(party.address ?? '');
        setCode(party.code ?? '');
        setNotes(party.notes ?? '');
        setOpeningBalance(party.openingBalance.rupees);
      })
      .catch((caught: unknown) => setError(messageOf(caught)));
  }, [id, path]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    const input: PartyInput = {
      name: name.trim(),
      phone: blankToUndefined(phone),
      businessName: blankToUndefined(businessName),
      address: blankToUndefined(address),
      code: blankToUndefined(code),
      notes: blankToUndefined(notes),
      openingBalance: blankToUndefined(openingBalance),
    };
    try {
      const saved = id ? await updateParty(path, id, input) : await createParty(path, input);
      router.push(`/books/${path}/${saved.id}`);
    } catch (caught) {
      setError(messageOf(caught));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <BackLink href={id ? `/books/${path}/${id}` : `/books/${path}`}>Back</BackLink>
      <PageTitle
        title={id ? 'Edit' : `New ${kind}`}
        text={kind === 'customer' ? 'Opening balance is the opening receivable.' : 'Opening balance is the opening payable.'}
      />
      <Field label="Name" value={name} onChange={setName} required />
      <Field label="Phone" value={phone} onChange={setPhone} />
      <Field label="Business name" value={businessName} onChange={setBusinessName} />
      <Field label="Address" value={address} onChange={setAddress} />
      <Field label="Code" value={code} onChange={setCode} />
      <TextArea label="Notes" value={notes} onChange={setNotes} />
      <Field label="Opening balance" value={openingBalance} onChange={setOpeningBalance} />
      <ErrorText>{error}</ErrorText>
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}

export function usePartyStatus(kind: 'customers' | 'vendors', party: Party | null, reload: () => void) {
  const [error, setError] = useState('');
  async function toggle() {
    if (!party) return;
    try {
      await setPartyStatus(kind, party.id, party.status === 'active' ? 'inactive' : 'active');
      reload();
    } catch (caught) {
      setError(messageOf(caught));
    }
  }
  return { error, toggle };
}
