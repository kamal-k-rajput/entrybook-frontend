import type { SubscriptionStatus } from '@/lib/types';

const styles: Record<SubscriptionStatus, string> = {
  pending: 'bg-[#f4ead2] text-[#7a5b16]',
  active: 'bg-[#dceee4] text-[#0e3b2c]',
  expired: 'bg-[#ece7df] text-[#5d675c]',
  suspended: 'bg-[#f8e8e8] text-[#8d2f2f]',
};

export function StatusPill({ status }: { status?: SubscriptionStatus | null }) {
  if (!status) {
    return <span className="rounded-full bg-[#ece7df] px-2.5 py-1 text-xs">No subscription</span>;
  }
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}
