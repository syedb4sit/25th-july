// Typed HTTP API client with auth token management and automatic retry

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE_URL: string = process.env['NEXT_PUBLIC_API_URL'] || '';

async function getAccessToken(): Promise<string | null> {
  try {
    const { useAuthStore } = await import('@/stores/auth.store');
    return useAuthStore.getState().accessToken;
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { useAuthStore } = await import('@/stores/auth.store');
    const store = useAuthStore.getState();
    if (typeof store.refreshToken === 'function') {
      await store.refreshToken();
      return useAuthStore.getState().accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-25thJuly-Request': 'true',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint}`;

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // On 401, try refreshing the token and retry once
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  let data: unknown;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `API request failed: ${response.statusText}`,
      data
    );
  }

  return data as T;
}

export const api = {
  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return fetchWithAuth<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return fetchWithAuth<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
