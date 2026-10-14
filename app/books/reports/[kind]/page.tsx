'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ErrorText, formatDay, messageOf, MoneyCard, PageTitle, PeriodBar, usePeriod } from '@/components/merchant/ui';
import { getCashReport, getCustomerReport, getDues, getExpenseReport, getVendorReport } from '@/lib/merchant';

const titles: Record<string, string> = {
  cash: 'Cash movement',
  customers: 'Customers',
  vendors: 'Vendors',
  dues: 'Dues',
  expenses: 'Personal expenses',
};

export default function ReportPage() {
  const params = useParams<{ kind: string }>();
  const period = usePeriod();
  const [error, setError] = useState('');
  const [body, setBody] = useState<ReactNode>(null);

  useEffect(() => {
    if (!period.ready) return;
    let cancelled = false;
    const filters = period.filters;
    const load = async () => {
      if (params.kind === 'cash') {
        const cash = await getCashReport(filters);
        return (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <MoneyCard label="In" money={cash.inflow} />
            <MoneyCard label="Out" money={cash.outflow} />
            <MoneyCard label="Net" money={cash.net} note={cash.note} />
          </div>
        );
      }
      if (params.kind === 'customers') {
        const report = await getCustomerReport(filters);
        return (
          <ul className="mt-6 divide-y divide-[var(--line)]">
            {report.items.map((row) => (
              <li key={row.customer.id} className="py-3 text-sm">
                <Link href={`/books/customers/${row.customer.id}`} className="font-medium">{row.customer.name}</Link>
                <p className="text-[var(--muted)]">Sales {row.salesInPeriod.display} · Received {row.receivedInPeriod.display} · Outstanding {row.outstanding.display}</p>
              </li>
            ))}
          </ul>
        );
      }
      if (params.kind === 'vendors') {
        const report = await getVendorReport(filters);
        return (
          <ul className="mt-6 divide-y divide-[var(--line)]">
            {report.items.map((row) => (
              <li key={row.vendor.id} className="py-3 text-sm">
                <Link href={`/books/vendors/${row.vendor.id}`} className="font-medium">{row.vendor.name}</Link>
                <p className="text-[var(--muted)]">Paid {row.paidInPeriod.display} · Till date {row.paidTillDate.display} · Payable {row.payable.display}</p>
              </li>
            ))}
          </ul>
        );
      }
      if (params.kind === 'dues') {
        const report = await getDues(filters);
        return (
          <div className="mt-6">
            <p className="text-sm text-[var(--muted)]">Open invoices as of {formatDay(report.asOf)}. Ageing uses today in Asia/Kolkata.</p>
            <ul className="mt-3 divide-y divide-[var(--line)]">
              {report.invoices.map((invoice) => (
                <li key={invoice.saleId} className="py-3 text-sm">
                  <Link href={`/books/sales/${invoice.saleId}`} className="font-medium">{invoice.customerName ?? 'Customer'} · {invoice.remaining.display}</Link>
                  <p className="text-[var(--muted)]">{invoice.invoiceNumber ?? 'No invoice'} · due {formatDay(invoice.dueDate)} · {invoice.bucket.replaceAll('_', ' ')}</p>
                </li>
              ))}
            </ul>
          </div>
        );
      }
      const report = await getExpenseReport(filters);
      return (
        <div className="mt-6 space-y-3">
          <MoneyCard label="Personal total" money={report.total} note={report.note} />
          {report.items.map((item) => (
            <p key={item.categoryName} className="text-sm">{item.categoryName}: {item.total.display}</p>
          ))}
        </div>
      );
    };
    load()
      .then((next) => {
        if (!cancelled) setBody(next);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(messageOf(caught));
      });
    return () => {
      cancelled = true;
    };
  }, [params.kind, period.ready, period.period, period.from, period.to]);

  return (
    <div>
      <PageTitle title={titles[params.kind] ?? 'Report'} />
      <div className="mt-4">
        <PeriodBar period={period.period} from={period.from} to={period.to} onPeriod={period.setPeriod} onFrom={period.setFrom} onTo={period.setTo} />
      </div>
      <ErrorText>{error}</ErrorText>
      {body}
    </div>
  );
}
