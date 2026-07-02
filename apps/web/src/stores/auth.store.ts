import { create } from 'zustand';
import { clearKeys } from '@/lib/storage/keystore';

// ── Local types ──────────────────────────────────────────────────────────────

interface UserPublicInfo {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  publicKey: string | null;
  identityKey: string | null;
  role: 'OWNER' | 'PARTNER';
}

interface AuthResponse {
  user: UserPublicInfo;
  accessToken: string;
}

interface AuthState {
  user: UserPublicInfo | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPasskey: (email: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: UserPublicInfo) => void;
  setAccessToken: (token: string) => void;
  initAuth: () => Promise<void>;
}

// ── Module-level state ───────────────────────────────────────────────────────

let refreshTimerId: ReturnType<typeof setInterval> | null = null;

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? '';

const REFRESH_INTERVAL_MS = 780_000; // 13 minutes

// ── Helpers ──────────────────────────────────────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function authFetch<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-25thJuly-Request': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

function startRefreshInterval(refreshFn: () => Promise<void>): void {
  stopRefreshInterval();
  refreshTimerId = setInterval(() => {
    refreshFn().catch(() => {
      /* silent – logout will be triggered by 401 in next request */
    });
  }, REFRESH_INTERVAL_MS);
}

function stopRefreshInterval(): void {
  if (refreshTimerId !== null) {
    clearInterval(refreshTimerId);
    refreshTimerId = null;
  }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const passwordHash = await hashPassword(password);
      const data = await authFetch<AuthResponse>('/api/auth/login', {
        email,
        passwordHash,
      });

      set({
        user: data.user,
        accessToken: data.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });

      startRefreshInterval(get().refreshToken);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithPasskey: async (email: string) => {
    set({ isLoading: true });
    try {
      // Passkey implementation to be completed
      throw new Error("Passkey login is not configured yet.");
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true });
    try {
      const passwordHash = await hashPassword(password);
      await authFetch<AuthResponse>('/api/auth/register', {
        email,
        passwordHash,
        displayName,
      });
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authFetch<void>('/api/auth/logout', {});
    } catch {
      /* best-effort */
    } finally {
      stopRefreshInterval();
      await clearKeys().catch(() => {});
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  refreshToken: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-25thJuly-Request': 'true',
        },
      });

      if (!res.ok) {
        throw new Error(`Refresh failed: ${res.status}`);
      }

      const data = (await res.json()) as { accessToken: string };
      set({ accessToken: data.accessToken });
    } catch (error) {
      set({ isAuthenticated: false, user: null, accessToken: null });
      stopRefreshInterval();
      throw error;
    }
  },

  setUser: (user: UserPublicInfo) => {
    set({ user });
  },

  setAccessToken: (token: string) => {
    set({ accessToken: token });
  },

  initAuth: async () => {
    set({ isLoading: true });
    try {
      await get().refreshToken();
      set({ isAuthenticated: true, isLoading: false });
      startRefreshInterval(get().refreshToken);
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },
}));
