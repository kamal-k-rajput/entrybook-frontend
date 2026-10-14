'use client';

import Link from 'next/link';
import { PageTitle } from '@/components/merchant/ui';

const reports = [
  ['cash', 'Cash movement'],
  ['customers', 'Customers'],
  ['vendors', 'Vendors'],
  ['dues', 'Dues'],
  ['expenses', 'Personal expenses'],
];

export default function ReportsPage() {
  return (
    <div>
      <PageTitle title="Reports" text="Sales are not treated as cash. Cash in is customer receipts." />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {reports.map(([id, label]) => (
          <li key={id}>
            <Link href={`/books/reports/${id}`} className="block rounded-2xl border border-[var(--line)] bg-[var(--paper-2)] px-4 py-5 font-[family-name:var(--font-display)] text-2xl">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
