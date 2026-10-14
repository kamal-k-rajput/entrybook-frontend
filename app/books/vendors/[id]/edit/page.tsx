'use client';

import { useParams } from 'next/navigation';
import { PartyForm } from '@/components/merchant/parties';

export default function EditVendorPage() {
  const params = useParams<{ id: string }>();
  return <PartyForm kind="vendor" id={params.id} />;
}
