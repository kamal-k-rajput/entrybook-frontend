'use client';

import { useEffect, useState } from 'react';
import { buttonClass, ErrorText, messageOf, PageTitle } from '@/components/merchant/ui';
import { listNotices, markAllNoticesRead, markNoticeRead } from '@/lib/merchant';
import type { Notice } from '@/lib/types';

export default function NotificationsPage() {
  const [items, setItems] = useState<Notice[]>([]);
  const [error, setError] = useState('');

  function load() {
    listNotices().then((page) => setItems(page.items)).catch((caught: unknown) => setError(messageOf(caught)));
  }

  useEffect(load, []);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <PageTitle title="Notifications" />
        <button
          type="button"
          className={buttonClass}
          onClick={() => markAllNoticesRead().then(load).catch((caught: unknown) => setError(messageOf(caught)))}
        >
          Mark all read
        </button>
      </div>
      <ErrorText>{error}</ErrorText>
      <ul className="mt-6 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--paper-2)]">
        {items.length === 0 ? <li className="px-4 py-6 text-sm text-[var(--muted)]">No notifications.</li> : null}
        {items.map((notice) => (
          <li key={notice.id} className="px-4 py-4">
            <button
              type="button"
              className="text-left"
              onClick={() => {
                if (!notice.readAt) markNoticeRead(notice.id).then(load).catch((caught: unknown) => setError(messageOf(caught)));
              }}
            >
              <p className="font-medium">{notice.title}</p>
              <p className="mt-1 text-sm">{notice.body}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{notice.readAt ? 'Read' : 'Unread'}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
