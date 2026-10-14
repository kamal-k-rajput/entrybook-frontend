'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BackLink, ErrorText, formatDay, messageOf, PageTitle, PeriodBar, usePeriod } from '@/components/merchant/ui';
import { getCustomerStatement } from '@/lib/merchant';
import type { Money, Party } from '@/lib/types';

export default function StatementPage() {
  const params = useParams<{ id: string }>();
  const period = usePeriod();
  const [party, setParty] = useState<Party | null>(null);
  const [opening, setOpening] = useState<Money | null>(null);
  const [outstanding, setOutstanding] = useState<Money | null>(null);
  const [entries, setEntries] = useState<{ id: string; kind: string; date: string; description: string; amount: Money; balance: Money }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!period.ready) return;
    let cancelled = false;
    getCustomerStatement(params.id, period.filters)
      .then((statement) => {
        if (cancelled) return;
        setParty(statement.customer);
        setOpening(statement.openingBalance);
        setOutstanding(statement.outstanding);
        setEntries(statement.entries);
        setError('');
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(messageOf(caught));
      });
    return () => {
      cancelled = true;
    };
  }, [params.id, period.ready, period.period, period.from, period.to]);

  return (
    <div>
      <BackLink href={`/books/customers/${params.id}`}>Back</BackLink>
      <div className="mt-4">
        <PageTitle title={party ? `${party.name} statement` : 'Statement'} text="Opening is the balance brought forward to the day before the period." />
      </div>
      <div className="mt-4">
        <PeriodBar period={period.period} from={period.from} to={period.to} onPeriod={period.setPeriod} onFrom={period.setFrom} onTo={period.setTo} />
      </div>
      <ErrorText>{error}</ErrorText>
      {opening && outstanding ? (
        <p className="mt-4 text-sm">Opening {opening.display} · Outstanding {outstanding.display}</p>
      ) : null}
      <ul className="mt-4 divide-y divide-[var(--line)]">
        {entries.map((entry) => (
          <li key={`${entry.kind}-${entry.id}-${entry.date}`} className="flex justify-between gap-4 py-3 text-sm">
            <span>{formatDay(entry.date)} · {entry.description}</span>
            <span>{entry.amount.display} · balance {entry.balance.display}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
