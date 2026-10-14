'use client';

import { useParams } from 'next/navigation';
import { PartyForm } from '@/components/merchant/parties';

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  return <PartyForm kind="customer" id={params.id} />;
}
