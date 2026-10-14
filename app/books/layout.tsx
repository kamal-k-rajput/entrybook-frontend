import { MerchantShell } from '@/components/merchant/shell';

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return <MerchantShell>{children}</MerchantShell>;
}
