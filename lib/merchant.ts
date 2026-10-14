import { authorizedFetch, api } from './api';
import type {
  AuditEntry,
  BusinessProfile,
  Category,
  Dashboard,
  LedgerTransaction,
  Me,
  Money,
  Notice,
  Page,
  Party,
  PeriodRange,
  Sale,
  Session,
  Subscription,
} from './types';

export interface PeriodQuery {
  period?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface PartyInput {
  name: string;
  phone?: string;
  businessName?: string;
  address?: string;
  code?: string;
  notes?: string;
  openingBalance?: string;
}

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

function idempotencyKey(): string {
  return crypto.randomUUID();
}

export function registerMerchant(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  businessName?: string;
  usage?: 'personal' | 'shop';
}): Promise<Session> {
  return api('/auth/register', { method: 'POST', body: JSON.stringify(input) }, false);
}

export function currentAccount(): Promise<Me> {
  return api('/auth/me');
}

export function getBusiness(): Promise<BusinessProfile> {
  return api('/business');
}

export function updateBusiness(input: { name: string; phone: string; address: string }): Promise<BusinessProfile> {
  return api('/business', { method: 'PATCH', body: JSON.stringify(input) });
}

export function getSubscription(): Promise<Subscription | null> {
  return api('/subscription');
}

export function listNotices(page = 1): Promise<Page<Notice>> {
  return api(`/notifications${query({ page, limit: 30 })}`);
}

export function markNoticeRead(id: string): Promise<Notice> {
  return api(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNoticesRead(): Promise<{ updated: boolean }> {
  return api('/notifications/read-all', { method: 'PATCH' });
}

export function listParties(
  kind: 'customers' | 'vendors',
  filters: { q?: string; status?: string; page?: number },
): Promise<Page<Party>> {
  return api(`/${kind}${query({ ...filters, limit: 20 })}`);
}

export function getParty(kind: 'customers' | 'vendors', id: string): Promise<Party> {
  return api(`/${kind}/${id}`);
}

export function createParty(kind: 'customers' | 'vendors', input: PartyInput): Promise<Party> {
  return api(`/${kind}`, { method: 'POST', body: JSON.stringify(input) });
}

export function updateParty(kind: 'customers' | 'vendors', id: string, input: PartyInput): Promise<Party> {
  return api(`/${kind}/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function setPartyStatus(kind: 'customers' | 'vendors', id: string, status: 'active' | 'inactive'): Promise<Party> {
  return api(`/${kind}/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
}

export function createSale(
  customerId: string,
  input: {
    date: string;
    amount: string;
    discount?: string;
    invoiceNumber?: string;
    dueDate?: string;
    notes?: string;
    confirmInactive?: boolean;
    allowAdvance?: boolean;
    initialReceipt?: { amount: string; date: string; paymentMethod: string };
  },
): Promise<{ sale: Sale; receipt: { receipt: LedgerTransaction; outstanding: Money } | null }> {
  return api(`/customers/${customerId}/sales`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey() },
    body: JSON.stringify(input),
  });
}

export function createReceipt(
  customerId: string,
  input: {
    amount: string;
    date: string;
    paymentMethod: string;
    reference?: string;
    notes?: string;
    allowAdvance?: boolean;
    confirmInactive?: boolean;
    allocations?: { saleId: string; amount: string }[];
  },
): Promise<{ receipt: LedgerTransaction; outstanding: Money }> {
  return api(`/customers/${customerId}/receipts`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey() },
    body: JSON.stringify(input),
  });
}

export function getSale(id: string): Promise<Sale> {
  return api(`/sales/${id}`);
}

export function voidSale(id: string, reason: string): Promise<Sale> {
  return api(`/sales/${id}/void`, { method: 'POST', body: JSON.stringify({ reason }) });
}

export function payVendor(
  vendorId: string,
  input: {
    amount: string;
    date: string;
    paymentMethod: string;
    reference?: string;
    notes?: string;
    categoryId?: string;
    confirmInactive?: boolean;
  },
): Promise<{ transaction: LedgerTransaction; vendor: { payable: Money; paidTillDate: Money } }> {
  return api(`/vendors/${vendorId}/payments`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey() },
    body: JSON.stringify(input),
  });
}

export function listCategories(expenseType?: string, active?: boolean): Promise<Category[]> {
  return api(`/categories${query({ expenseType, active })}`);
}

export function createCategory(name: string, expenseType: 'personal' | 'business'): Promise<Category> {
  return api('/categories', { method: 'POST', body: JSON.stringify({ name, expenseType }) });
}

export function updateCategory(id: string, input: { name?: string; active?: boolean }): Promise<Category> {
  return api(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function createExpense(input: {
  expenseType: 'personal' | 'business';
  amount: string;
  date: string;
  categoryId: string;
  paymentMethod: string;
  notes?: string;
}): Promise<LedgerTransaction> {
  return api('/expenses', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey() },
    body: JSON.stringify(input),
  });
}

export interface TransactionPage {
  period: PeriodRange;
  items: LedgerTransaction[];
  page: number;
  limit: number;
  total: number;
}

export function listTransactions(filters: PeriodQuery & { type?: string; status?: string; q?: string }): Promise<TransactionPage> {
  return api(`/transactions${query({ ...filters, limit: filters.limit ?? 20 })}`);
}

export function getTransaction(id: string): Promise<LedgerTransaction> {
  return api(`/transactions/${id}`);
}

export function reverseTransaction(id: string, reason: string): Promise<LedgerTransaction> {
  return api(`/transactions/${id}/reverse`, { method: 'POST', body: JSON.stringify({ reason }) });
}

export function getDashboard(filters: PeriodQuery): Promise<Dashboard> {
  return api(`/dashboard${query(filters)}`);
}

export function getCashReport(filters: PeriodQuery): Promise<Dashboard['cash'] & { period: PeriodRange }> {
  return api(`/reports/cash-movement${query(filters)}`);
}

export function getCustomerReport(filters: PeriodQuery): Promise<{
  period: PeriodRange;
  items: { customer: Party; salesInPeriod: Money; receivedInPeriod: Money; outstanding: Money }[];
}> {
  return api(`/reports/customers${query(filters)}`);
}

export function getVendorReport(filters: PeriodQuery): Promise<{
  period: PeriodRange;
  items: { vendor: Party; paidInPeriod: Money; paidTillDate: Money; payable: Money }[];
}> {
  return api(`/reports/vendors${query(filters)}`);
}

export function getDues(filters: PeriodQuery): Promise<{
  asOf: string;
  invoices: {
    saleId: string;
    customerId: string;
    customerName: string | null;
    invoiceNumber: string | null;
    date: string;
    dueDate: string | null;
    remaining: Money;
    bucket: string;
  }[];
}> {
  return api(`/reports/dues${query(filters)}`);
}

export function getExpenseReport(filters: PeriodQuery): Promise<{
  period: PeriodRange;
  total: Money;
  note?: string;
  items: { categoryName: string; total: Money }[];
}> {
  return api(`/reports/expenses${query(filters)}`);
}

export function getCustomerLedger(id: string, filters: PeriodQuery): Promise<{
  customer: Party;
  openingBalance: Money;
  outstanding: Money;
  entries: { id: string; kind: string; date: string; description: string; amount: Money; balance: Money }[];
}> {
  return api(`/reports/customers/${id}/ledger${query({ ...filters, limit: 30 })}`);
}

export function getCustomerStatement(id: string, filters: PeriodQuery): Promise<{
  customer: Party;
  openingBalance: Money;
  outstanding: Money;
  entries: { id: string; kind: string; date: string; description: string; amount: Money; balance: Money }[];
}> {
  return api(`/reports/customers/${id}/statement${query(filters)}`);
}

export function getVendorLedger(id: string, filters: PeriodQuery): Promise<{
  vendor: Party;
  summary: { paidInPeriod: Money; paidTillDate: Money; payable: Money };
  transactions: { id: string; date: string; amount: Money; paymentMethod: string; status: string; reference: string | null }[];
}> {
  return api(`/reports/vendors/${id}/ledger${query({ ...filters, limit: 50 })}`);
}

export function listAudit(page = 1): Promise<Page<AuditEntry>> {
  return api(`/audit-logs${query({ page, limit: 30 })}`);
}

export async function downloadTransactions(filters: PeriodQuery & { type?: string; status?: string; q?: string }): Promise<Blob> {
  const response = await authorizedFetch(`/reports/transactions/export${query(filters)}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
    const message = Array.isArray(body?.message) ? body.message.join(' ') : 'The export could not be created.';
    throw new Error(typeof body?.message === 'string' ? body.message : message);
  }
  return response.blob();
}

export function todayKolkata(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

export function blankToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
