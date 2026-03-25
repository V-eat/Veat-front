/**
 * Base API client for the V'EAT backend.
 *
 * Automatically attaches the Supabase JWT from the current session
 * to every request so the backend can validate the caller's identity.
 */

import { supabase } from '@/integrations/supabase/client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let cachedToken: string | null = null;
let cachedTokenExpiresAt: number | null = null;

const setTokenCache = (token: string | null, expiresAt?: number | null) => {
  cachedToken = token;
  cachedTokenExpiresAt = expiresAt ?? null;
};

const isTokenStillValid = (expiresAt?: number | null) => {
  if (!expiresAt) return true;
  const now = Math.floor(Date.now() / 1000);
  return expiresAt > now + 15;
};

supabase.auth.onAuthStateChange((_event, session) => {
  setTokenCache(session?.access_token ?? null, session?.expires_at ?? null);
});

async function getToken(): Promise<string | null> {
  if (cachedToken && isTokenStillValid(cachedTokenExpiresAt)) {
    return cachedToken;
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (session?.access_token && isTokenStillValid(session.expires_at)) {
    setTokenCache(session.access_token, session.expires_at ?? null);
    return session.access_token;
  }

  if (!session) {
    setTokenCache(null, null);
    return null;
  }

  // Token missing or expired — force a refresh
  const { data: refreshData } = await supabase.auth.refreshSession();
  const refreshedToken = refreshData.session?.access_token ?? null;
  setTokenCache(refreshedToken, refreshData.session?.expires_at ?? null);
  return refreshedToken;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
