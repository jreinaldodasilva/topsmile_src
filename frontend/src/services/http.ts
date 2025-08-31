// src/services/http.ts
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export interface HttpResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  message?: string;
}

/**
 * Centralized request helper with automatic token refresh (refresh token rotation).
 * Uses localStorage keys:
 *  - 'topsmile_access_token' for short-lived JWT access token
 *  - 'topsmile_refresh_token' for refresh token string stored server-side
 */
export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
  includeAuth = true,
  signal?: AbortSignal
): Promise<HttpResponse<T>> {
  const ACCESS_KEY = 'topsmile_access_token';
  const REFRESH_KEY = 'topsmile_refresh_token';

  let isRefreshing = false;
  let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason: any) => void; }> = [];

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    failedQueue = [];
  };

  const makeRequest = async (authToken?: string): Promise<HttpResponse<T>> => {
    const token = authToken ?? (includeAuth ? (localStorage.getItem(ACCESS_KEY) || '') : '');

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const mergedHeaders = {
      ...defaultHeaders,
      ...(options.headers as Record<string, string> | undefined)
    };

    const config: RequestInit = {
      ...options,
      headers: mergedHeaders,
      signal: signal ?? (options.signal as AbortSignal | undefined)
    };

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const res = await fetch(url, config);

    const text = await res.text();
    let payload: any = undefined;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { message: text };
      }
    }

    if (!res.ok) {
      const err = new Error(payload?.message || `HTTP ${res.status} ${res.statusText}`.trim());
      (err as any).status = res.status;
      (err as any).body = payload;
      throw err;
    }

    return {
      ok: res.ok,
      status: res.status,
      data: payload?.data ?? payload,
      message: payload?.message
    };
  };

  try {
    return await makeRequest();
  } catch (err: any) {
    if (err?.status === 401 && includeAuth) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => makeRequest(token as string));
      }

      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem(REFRESH_KEY);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (!refreshRes.ok) {
          throw new Error('Token refresh failed');
        }

        const refreshData = await refreshRes.json();
        const { accessToken, refreshToken: newRefreshToken } = refreshData.data ?? refreshData;

        localStorage.setItem(ACCESS_KEY, accessToken);
        localStorage.setItem(REFRESH_KEY, newRefreshToken);

        processQueue(null, accessToken);
        return await makeRequest(accessToken);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    throw err;
  }
}
