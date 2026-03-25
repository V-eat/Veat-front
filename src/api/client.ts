/**
 * Base API client for the V'EAT backend.
 *
 * Automatically attaches the Supabase JWT from the current session
 * to every request so the backend can validate the caller's identity.
 */

import { supabase } from '@/integrations/supabase/client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    // Check if token is expired
    const expiresAt = (session as any).expires_at as number | undefined;
    const now = Math.floor(Date.now() / 1000);
    if (!expiresAt || expiresAt > now) {
      return session.access_token;
    }
  }
  // Token missing or expired — force a refresh
  const { data: refreshData } = await supabase.auth.refreshSession();
  return refreshData.session?.access_token ?? null;
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
