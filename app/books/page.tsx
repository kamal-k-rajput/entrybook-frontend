'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMerchant } from '@/components/merchant/shell';
import { buttonClass, ErrorText, formatDay, messageOf, MoneyCard, PageTitle, PeriodBar, usePeriod } from '@/components/merchant/ui';
import { getDashboard } from '@/lib/merchant';
import type { Dashboard } from '@/lib/types';

export default function BooksHomePage() {
  const account = useMerchant();
  const period = usePeriod();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!account?.subscription?.active || !period.ready) return;
    let cancelled = false;
    getDashboard(period.filters)
      .then((next) => {
        if (!cancelled) setDashboard(next);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(messageOf(caught));
      });
    return () => {
      cancelled = true;
    };
  }, [account, period.ready, period.period, period.from, period.to]);

  if (account && !account.subscription?.active) {
    const subscription = account.subscription;
    return (
      <div className="max-w-xl">
        <PageTitle
          title="Subscription"
          text="The ledger opens after an administrator receives payment and sets the end date. You can still update the shop and read notifications."
        />
        <div className="mt-6 space-y-2 rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] p-5 text-sm">
          <p className="capitalize">Status: {subscription?.status ?? 'pending'}</p>
          {subscription?.planName ? <p>Plan: {subscription.planName}</p> : null}
          {subscription?.endDate ? <p>Ends: {formatDay(subscription.endDate)}</p> : null}
          {subscription?.amountPaid ? <p>Paid: {subscription.amountPaid.display}</p> : null}
          {subscription?.note ? <p>{subscription.note}</p> : null}
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <Link href="/books/business" className="text-[var(--green)]">
            Business profile
          </Link>
          <Link href="/books/notifications" className="text-[var(--green)]">
            Notifications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTitle
        title="Home"
        text={account?.subscription?.endDate ? `Active until ${formatDay(account.subscription.endDate)}.` : 'A sale is not cash received.'}
      />
      <div className="mt-6">
        <PeriodBar
          period={period.period}
          from={period.from}
          to={period.to}
          onPeriod={period.setPeriod}
          onFrom={period.setFrom}
          onTo={period.setTo}
        />
      </div>
      <ErrorText>{error}</ErrorText>
      {dashboard ? (
        <>
          {account?.user.usage === 'personal' ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <MoneyCard label="Personal spend" money={dashboard.personal?.spent ?? dashboard.cash.personalExpense} note="What you spent from your own pocket." />
                <MoneyCard label="Given" money={dashboard.personal?.given ?? dashboard.cash.inflow} />
                <MoneyCard label="Received" money={dashboard.personal?.received ?? dashboard.cash.outflow} />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/books/customers" className={buttonClass}>Friends & family</Link>
                <Link href="/books/expenses/new" className={buttonClass}>Personal expense</Link>
              </div>
            </>
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <MoneyCard label="Cash in" money={dashboard.cash.inflow} />
                <MoneyCard label="Cash out" money={dashboard.cash.outflow} />
                <MoneyCard label="Net cash" money={dashboard.cash.net} note={dashboard.cash.note} />
                <MoneyCard label="Invoiced sales" money={dashboard.sales.invoicedInPeriod} note={dashboard.sales.note} />
                <MoneyCard label="Customer outstanding" money={dashboard.customers.outstanding} />
                <MoneyCard label="Vendor payable" money={dashboard.vendors.payable} note={dashboard.vendors.note} />
                <MoneyCard label="Personal expenses" money={dashboard.cash.personalExpense} />
                <MoneyCard label="Business outflow" money={dashboard.cash.businessOutflow} />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/books/customers" className={buttonClass}>New sale</Link>
                <Link href="/books/vendors" className={buttonClass}>Vendor payment</Link>
                <Link href="/books/expenses/new" className={buttonClass}>Expense</Link>
              </div>
            </>
          )}
        </>
      ) : (
        <p className="mt-6 text-sm text-[var(--muted)]">Loading this period…</p>
      )}
    </div>
  );
}
