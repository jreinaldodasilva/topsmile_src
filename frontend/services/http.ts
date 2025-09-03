// src/services/http.ts - Updated for Backend Integration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export interface HttpResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  message?: string;
}

const ACCESS_KEY = 'topsmile_access_token';
const REFRESH_KEY = 'topsmile_refresh_token';

type RequestOptions = RequestInit & { auth?: boolean };

/** Parse response to match backend format */
async function parseResponse(res: Response): Promise<HttpResponse> {
  const text = await res.text();
  let payload: any = undefined;
  
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (e) {
      payload = { message: text };
    }
  }

  // UPDATED: Handle backend response format
  if (!res.ok) {
    return { 
      ok: false, 
      status: res.status, 
      data: payload?.data, 
      message: payload?.message || res.statusText 
    };
  }

  return { 
    ok: true, 
    status: res.status, 
    data: payload?.data || payload, // Backend sometimes wraps data, sometimes not
    message: payload?.message 
  };
}

let refreshingPromise: Promise<void> | null = null;

/** UPDATED: Perform token refresh using backend endpoint */
async function performRefresh(): Promise<void> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) throw new Error('No refresh token available');

  const url = `${API_BASE_URL}/api/auth/refresh`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }) // Backend expects { refreshToken }
  });

  const parsedResponse = await parseResponse(res);

  if (!parsedResponse.ok) {
    // Clear tokens on refresh failure
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    
    // Trigger storage event to logout across tabs
    window.dispatchEvent(new StorageEvent('storage', {
      key: ACCESS_KEY,
      newValue: null,
      oldValue: localStorage.getItem(ACCESS_KEY)
    }));
    
    throw new Error(parsedResponse.message || 'Failed to refresh token');
  }

  const { data } = parsedResponse;
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error('Refresh response missing tokens');
  }

  // Store new tokens
  localStorage.setItem(ACCESS_KEY, data.accessToken);
  localStorage.setItem(REFRESH_KEY, data.refreshToken);
}

/** UPDATED: Enhanced request function with better error handling */
export async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<HttpResponse<T>> {
  const { auth = true, ...restOfOptions } = options;

  const makeRequest = async (token?: string | null) => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(restOfOptions.headers || {})
    });

    if (auth && token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const config: RequestInit = {
      ...restOfOptions,
      headers,
      body: restOfOptions.body ?? undefined
    };

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    try {
      const res = await fetch(url, config);
      return res;
    } catch (networkError) {
      // Handle network errors (no internet, server down, etc.)
      throw new Error('Network error - please check your connection');
    }
  };

  try {
    const accessToken = localStorage.getItem(ACCESS_KEY);
    const res = await makeRequest(accessToken);
    
    // If not 401, return the response
    if (res.status !== 401) {
      return (await parseResponse(res)) as HttpResponse<T>;
    }

    // Handle 401 - try refresh flow
    if (!refreshingPromise) {
      refreshingPromise = performRefresh()
        .catch((err) => {
          refreshingPromise = null;
          throw err;
        })
        .finally(() => {
          refreshingPromise = null;
        });
    }

    await refreshingPromise;

    // Retry original request with new access token
    const newAccess = localStorage.getItem(ACCESS_KEY);
    const retryRes = await makeRequest(newAccess);
    return (await parseResponse(retryRes)) as HttpResponse<T>;
    
  } catch (err: any) {
    // Handle specific error types
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    
    if (err instanceof Error) {
      throw err;
    }

    throw new Error('An unknown network error occurred');
  }
}

/** UPDATED: Logout function to call backend endpoint */
export async function logout(refreshToken?: string): Promise<void> {
  const token = refreshToken || localStorage.getItem(REFRESH_KEY);
  
  // Clear local tokens first
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  
  // Notify backend about logout (don't wait for response)
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token })
      });
    } catch (error) {
      // Ignore logout errors - tokens are already cleared locally
      console.warn('Failed to notify backend about logout:', error);
    }
  }
  
  // Trigger storage event for cross-tab logout
  window.dispatchEvent(new StorageEvent('storage', {
    key: ACCESS_KEY,
    newValue: null,
    oldValue: null
  }));
}

/** ADDED: Check if tokens exist */
export function hasTokens(): boolean {
  return !!(localStorage.getItem(ACCESS_KEY) && localStorage.getItem(REFRESH_KEY));
}

/** ADDED: Get current access token */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

/** ADDED: Get current refresh token */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}