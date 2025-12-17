/**
 * Auth Store (Zustand)
 *
 * SECURITY BEST PRACTICES (why this store looks the way it does):
 * - Access token: stored ONLY in memory (this store). If an attacker can run JS (XSS), they can
 *   read it anyway. Avoiding localStorage reduces how long a stolen token lives.
 * - Refresh token: stored in an httpOnly cookie set by the server. JavaScript cannot read it,
 *   which reduces impact of XSS. The browser still sends it automatically with `credentials: 'include'`.
 * - Refresh rotation: calling /auth/refresh replaces the refresh token each time.
 */

import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

type ApiError = {
  message: string;
  code?: string;
  statusCode?: number;
};

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  totpEnabled: boolean;
};

export type TotpSetup = {
  secret: string;
  otpauthUrl: string;
};

async function apiRequest<T>(
  path: string,
  init: RequestInit & { auth?: { accessToken?: string | null } } = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  if (init.auth?.accessToken) {
    headers.set('Authorization', `Bearer ${init.auth.accessToken}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  const json = (await res.json().catch(() => null)) as any;

  if (!res.ok) {
    const err: ApiError = {
      message: json?.message || json?.error || 'Request failed',
      code: json?.code,
      statusCode: json?.statusCode || res.status,
    };
    throw err;
  }

  return json as T;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;

  isHydrating: boolean;
  error: ApiError | null;

  totpSetup: TotpSetup | null;

  clearError: () => void;

  register: (input: {
    username: string;
    email: string;
    displayName: string;
    password: string;
    enable2fa?: boolean;
  }) => Promise<void>;

  login: (input: { identifier: string; password: string; totpCode?: string }) => Promise<void>;

  logout: () => Promise<void>;

  refreshAccessToken: () => Promise<void>;

  fetchMe: () => Promise<void>;

  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,

  isHydrating: false,
  error: null,

  totpSetup: null,

  clearError: () => set({ error: null }),

  register: async (input) => {
    set({ error: null, totpSetup: null });

    try {
      const res = await apiRequest<{
        status: 'success';
        data: { user: AuthUser; accessToken: string; totpSetup?: TotpSetup };
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      });

      set({
        user: res.data.user,
        accessToken: res.data.accessToken,
        totpSetup: res.data.totpSetup ?? null,
      });
    } catch (e) {
      set({ error: e as ApiError });
      throw e;
    }
  },

  login: async (input) => {
    set({ error: null });

    try {
      const res = await apiRequest<{
        status: 'success';
        data: { user: AuthUser; accessToken: string };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      });

      set({ user: res.data.user, accessToken: res.data.accessToken });
    } catch (e) {
      set({ error: e as ApiError });
      throw e;
    }
  },

  logout: async () => {
    set({ error: null });

    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      // Clear memory state even if the network call fails.
      set({ user: null, accessToken: null, totpSetup: null });
    }
  },

  refreshAccessToken: async () => {
    set({ error: null });

    const res = await apiRequest<{
      status: 'success';
      data: { accessToken: string };
    }>('/auth/refresh', {
      method: 'POST',
    });

    set({ accessToken: res.data.accessToken });
  },

  fetchMe: async () => {
    const token = get().accessToken;
    if (!token) return;

    const res = await apiRequest<{
      status: 'success';
      data: { user: AuthUser };
    }>('/auth/me', {
      method: 'GET',
      auth: { accessToken: token },
    });

    set({ user: res.data.user });
  },

  hydrate: async () => {
    // Called at app startup.
    // If the user has a valid refresh cookie, we can restore an access token without needing login.
    if (get().isHydrating) return;

    set({ isHydrating: true, error: null });

    try {
      await get().refreshAccessToken();
      await get().fetchMe();
    } catch {
      set({ user: null, accessToken: null });
    } finally {
      set({ isHydrating: false });
    }
  },
}));
