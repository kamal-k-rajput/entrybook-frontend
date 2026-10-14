import type { Page, Session } from './types';

const ACCESS_KEY = 'entrybook.accessToken';
const REFRESH_KEY = 'entrybook.refreshToken';
const USER_KEY = 'entrybook.user';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code = 'UNKNOWN',
  ) {
    super(message);
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getStoredUser<T>(): T | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(ACCESS_KEY, session.accessToken);
  localStorage.setItem(REFRESH_KEY, session.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

function errorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object' || !('message' in body)) return fallback;
  const message = (body as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join(' ');
  if (typeof message === 'string' && message.length > 0) return message;
  return fallback;
}

function errorCode(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'code' in body && typeof (body as { code?: unknown }).code === 'string') {
    return (body as { code: string }).code;
  }
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  return 'UNKNOWN';
}

export async function authorizedFetch(path: string, init: RequestInit = {}, allowRefresh = true): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`/api/v1${path}`, { ...init, headers });
  if (response.status === 401 && allowRefresh && localStorage.getItem(REFRESH_KEY)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return authorizedFetch(path, init, false);
  }
  return response;
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const body = (await response.json().catch(() => null)) as {
    success?: boolean;
    data?: Session;
  } | null;
  if (!response.ok || !body?.success || !body.data) {
    clearSession();
    return false;
  }
  saveSession(body.data);
  return true;
}

export async function api<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {
  const response = await authorizedFetch(path, init, allowRefresh);
  const body = (await response.json().catch(() => null)) as {
    success?: boolean;
    data?: T;
    message?: unknown;
    code?: string;
  } | null;

  if (!response.ok || !body?.success) {
    throw new ApiError(
      errorMessage(body, 'The request could not be completed.'),
      response.status,
      errorCode(body, response.status),
    );
  }
  return body.data as T;
}

export function login(email: string, password: string): Promise<Session> {
  return api<Session>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false);
}

export function setUsage(usage: 'personal' | 'shop'): Promise<import('./types').Me> {
  return api('/auth/usage', { method: 'PATCH', body: JSON.stringify({ usage }) });
}

export function logout(): Promise<{ loggedOut: boolean }> {
  return api('/auth/logout', { method: 'POST' });
}

export async function listMerchants(query: {
  q?: string;
  subscriptionStatus?: string;
  page?: number;
}): Promise<Page<import('./types').MerchantRecord>> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.subscriptionStatus) params.set('subscriptionStatus', query.subscriptionStatus);
  params.set('page', String(query.page ?? 1));
  params.set('limit', '20');
  return api(`/admin/merchants?${params.toString()}`);
}

export function getMerchant(userId: string): Promise<import('./types').MerchantRecord> {
  return api(`/admin/merchants/${userId}`);
}

export function setMerchantPassword(userId: string, password: string): Promise<{ updated: boolean }> {
  return api(`/admin/merchants/${userId}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
}

export function listSubscriptions(query: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<Page<import('./types').Subscription>> {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  params.set('page', String(query.page ?? 1));
  params.set('limit', String(query.limit ?? 20));
  return api(`/admin/subscriptions?${params.toString()}`);
}

export function activateSubscription(
  businessId: string,
  payload: {
    endDate: string;
    startDate?: string;
    planName?: string;
    paymentReference?: string;
    amountPaid?: string;
    note?: string;
  },
): Promise<import('./types').Subscription> {
  return api(`/admin/businesses/${businessId}/subscription/activate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateSubscription(
  businessId: string,
  payload: {
    endDate?: string;
    status?: string;
    planName?: string;
    paymentReference?: string;
    note?: string;
  },
): Promise<import('./types').Subscription> {
  return api(`/admin/businesses/${businessId}/subscription`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
