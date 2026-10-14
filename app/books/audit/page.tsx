'use client';

import { useEffect, useState } from 'react';
import { ErrorText, messageOf, PageTitle } from '@/components/merchant/ui';
import { listAudit } from '@/lib/merchant';
import type { AuditEntry } from '@/lib/types';

export default function AuditPage() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listAudit().then((page) => setItems(page.items)).catch((caught: unknown) => setError(messageOf(caught)));
  }, []);

  return (
    <div>
      <PageTitle title="Audit log" text="Financial corrections stay here. The original row is kept." />
      <ErrorText>{error}</ErrorText>
      <ul className="mt-6 divide-y divide-[var(--line)]">
        {items.map((entry) => (
          <li key={entry.id} className="py-3 text-sm">
            <button type="button" className="font-medium" onClick={() => setOpen(open === entry.id ? null : entry.id)}>
              {entry.action} · {entry.entityType}
            </button>
            <p className="text-[var(--muted)]">{new Date(entry.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            {open === entry.id ? (
              <pre className="mt-2 overflow-x-auto rounded-xl bg-white p-3 text-xs">{JSON.stringify({ before: entry.before, after: entry.after }, null, 2)}</pre>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
