export type UserRole = 'admin' | 'merchant';

export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'suspended';

export interface Money {
  paise: number;
  rupees: string;
  display: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  businessId: string | null;
  usage?: 'personal' | 'shop';
}

export interface BusinessProfile {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  currency: string;
  timezone: string;
}

export interface Subscription {
  id: string;
  businessId: string;
  status: SubscriptionStatus;
  planName: string | null;
  startDate: string | null;
  endDate: string | null;
  paymentReference: string | null;
  amountPaid: Money | null;
  note: string | null;
  active: boolean;
  activatedAt: string | null;
}

export interface MerchantRecord {
  user: UserProfile;
  business: BusinessProfile | null;
  subscription: Subscription | null;
}

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfile;
  subscription: Subscription | null;
}

export interface Me {
  user: UserProfile;
  business: BusinessProfile | null;
  subscription: Subscription | null;
}

export interface Party {
  id: string;
  type: 'vendor' | 'customer';
  name: string;
  phone: string | null;
  businessName: string | null;
  address: string | null;
  code: string | null;
  notes: string | null;
  status: 'active' | 'inactive';
  openingBalance: Money;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerTransaction {
  id: string;
  businessId?: string;
  partyId: string | null;
  partyName: string | null;
  categoryId: string | null;
  type: string;
  direction: 'in' | 'out';
  date: string;
  amount: Money;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  status: 'posted' | 'reversed';
  reversalReason: string | null;
  reversedAt: string | null;
  createdAt: string;
}

export interface Sale {
  id: string;
  customerId: string;
  invoiceNumber: string | null;
  date: string;
  grossAmount: Money;
  discount: Money;
  netAmount: Money;
  dueDate: string | null;
  status: 'open' | 'partial' | 'paid' | 'void';
  notes: string | null;
  voidReason: string | null;
  createdAt: string;
  allocated?: Money;
  remaining?: Money;
}

export interface Category {
  id: string;
  name: string;
  expenseType: 'personal' | 'business';
  active: boolean;
  isSystem: boolean;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  createdAt: string;
}

export interface PeriodRange {
  from: string;
  to: string;
  period: string;
}

export interface Dashboard {
  period: PeriodRange;
  currency: string;
  cash: {
    inflow: Money;
    outflow: Money;
    net: Money;
    personalExpense: Money;
    businessOutflow: Money;
    note: string;
  };
  sales: { invoicedInPeriod: Money; note: string };
  customers: { outstanding: Money };
  vendors: { paidInPeriod: Money; payable: Money; note: string };
  personal?: { given: Money; received: Money; spent: Money };
}

export interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  before: unknown;
  after: unknown;
  createdAt: string;
}
