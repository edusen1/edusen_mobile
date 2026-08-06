// ============================================================
// API Client — edusen_mobile
// ============================================================

import * as SecureStore from 'expo-secure-store';
import type {
  LoginResponse,
  MeResponse,
  Eleve,
  ElevePaged,
  DetteSummary,
} from '../types';

const BASE_URL = 'https://edusen-api.assanediallo.com/api';

const TOKEN_KEY = 'edusen_access_token';
const REFRESH_KEY = 'edusen_refresh_token';
const TENANT_KEY = 'edusen_tenant_id';

// ------------------------------------------------------------------
// Token helpers
// ------------------------------------------------------------------

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getTenantId(): Promise<string | null> {
  return SecureStore.getItemAsync(TENANT_KEY);
}

async function saveTokens(access: string, refresh: string | null, tenantId?: string | null): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, access);
  if (refresh) {
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  }
  if (tenantId) {
    await SecureStore.setItemAsync(TENANT_KEY, tenantId);
  }
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(TENANT_KEY);
}

// ------------------------------------------------------------------
// Generic fetch wrapper
// ------------------------------------------------------------------

let isRefreshing = false;

async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing) return false;
  isRefreshing = true;
  try {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!refreshToken) return false;

    const response = await fetch(`${BASE_URL}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data.accessToken) {
      await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
      if (data.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = await getToken();
  const tenantId = await getTenantId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Auto-refresh on 401
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, options, false);
    }
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ApiError(response.status, body);
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`API Error ${status}: ${body}`);
    this.name = 'ApiError';
  }
}

// ------------------------------------------------------------------
// Auth
// ------------------------------------------------------------------

export async function login(
  loginId: string,
  password: string,
): Promise<LoginResponse> {
  const result = await apiFetch<LoginResponse>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login: loginId, password }),
  });

  // Fetch user info to get tenantId
  // We need to temporarily store the token before calling /me
  await saveTokens(result.accessToken, result.refreshToken);

  try {
    const me = await apiFetch<MeResponse>('/v1/auth/me');
    if (me.tenantId) {
      await SecureStore.setItemAsync(TENANT_KEY, me.tenantId);
    }
  } catch {
    // Non-blocking — we can work without tenantId in some cases
  }

  return result;
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/v1/auth/logout', { method: 'POST' });
  } catch {
    // Ignore logout errors
  }
  await clearTokens();
}

export async function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/v1/auth/me');
}

// ------------------------------------------------------------------
// Eleves
// ------------------------------------------------------------------

/** Scan result from POST /admin/eleves/scan */
export interface ScanResponse {
  found: boolean;
  scanResult: 'EN_REGLE' | 'DETTES' | 'NON_INSCRIT' | 'INACTIF' | 'NOT_FOUND';
  eleve: Eleve | null;
  inscription: { statut: string } | null;
  dettes: DetteSummary | null;
}

/** Scan a student by matricule or userId — audited endpoint */
export async function scanEleve(query: string): Promise<ScanResponse> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const body = uuidRegex.test(query)
    ? { userId: query }
    : { matricule: query };

  return apiFetch<ScanResponse>('/admin/eleves/scan', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Check if the device has network connectivity by pinging the health endpoint */
export async function isOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${BASE_URL}/v1/auth/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}
