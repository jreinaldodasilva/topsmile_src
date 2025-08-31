// src/services/http.ts
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export interface HttpResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  message?: string;
}

/**
 * Frontend HTTP helper with automatic access token refresh.
 * - access token expected in localStorage under 'topsmile_access_token'
 * - refresh token expected in localStorage under 'topsmile_refresh_token'
 *
 * Behavior:
 * - Attaches Authorization: Bearer <accessToken> when `auth=true` (default).
 * - On 401 responses, attempts to call POST /api/auth/refresh with { refreshToken }
 * If refresh succeeds, stores new tokens and retries the original request once.
 * - Prevents multiple concurrent refresh calls via a single promise queue.
 * - Normalizes responses into HttpResponse<T> shape.
 */

const ACCESS_KEY = 'topsmile_access_token';
const REFRESH_KEY = 'topsmile_refresh_token';

type RequestOptions = RequestInit & { auth?: boolean };

/** Simple helper to parse fetch responses */
async function parseResponse(res: Response): Promise<HttpResponse> {
  const text = await res.text();
  let payload: any = undefined;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (e) {
      // not JSON — keep raw text
      payload = text;
    }
  }

  const message = payload?.message || res.statusText;

  if (!res.ok) {
    return { ok: false, status: res.status, data: payload?.data, message };
  }

  return { ok: true, status: res.status, data: payload?.data, message };
}

/** Single refresh promise to avoid concurrent refresh calls */
let refreshingPromise: Promise<void> | null = null;

/** Perform token refresh using refresh token from localStorage */
async function performRefresh(): Promise<void> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) throw new Error('No refresh token available');

  const url = `${API_BASE_URL}/api/auth/refresh`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  // Reuse the existing helper to parse the response
  const parsedResponse = await parseResponse(res);

  if (!parsedResponse.ok) {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    throw new Error(parsedResponse.message || 'Failed to refresh token');
  }

  const { data } = parsedResponse;
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error('Refresh response missing tokens');
  }

  localStorage.setItem(ACCESS_KEY, data.accessToken);
  localStorage.setItem(REFRESH_KEY, data.refreshToken);
}

/** Public request function */
export async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<HttpResponse<T>> {
  // Destructure 'auth' from options with a default value for a cleaner API
  const { auth = true, ...restOfOptions } = options;

  const mergedHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(restOfOptions.headers || {})
  };

  const makeRequest = async (token?: string | null) => {
    // build headers fresh for each call to avoid mutation surprises

    // Initialize a new Headers object
    const headers = new Headers(mergedHeaders);

    if (auth && token) {
      // Use the .set() method to add or update a header
      headers.set('Authorization', `Bearer ${token}`);
    }

    const config: RequestInit = {
      ...restOfOptions,
      headers,
      // ensure GET requests don't accidentally send an empty body
      body: restOfOptions.body ?? undefined
    };

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const res = await fetch(url, config);
    return res;
  };

  try {
    const accessToken = localStorage.getItem(ACCESS_KEY);
    const res = await makeRequest(accessToken);
    if (res.status !== 401) {
      // normal successful or other error — parse and return
      return (await parseResponse(res)) as HttpResponse<T>;
    }

    // Got 401 — try refresh flow
    // If a refresh is already in progress, await it instead of creating a new one
    if (!refreshingPromise) {
      refreshingPromise = performRefresh()
        .catch((err) => {
          // Ensure the promise is cleared on failure to allow future retries
          refreshingPromise = null;
          throw err; // Re-throw to propagate the error
        })
        .finally(() => {
          // Clear the promise once it's settled (either resolved or rejected)
          refreshingPromise = null;
        });
    }

    await refreshingPromise;

    // Retry original request with new access token
    const newAccess = localStorage.getItem(ACCESS_KEY);
    const retryRes = await makeRequest(newAccess);
    return (await parseResponse(retryRes)) as HttpResponse<T>;
  } catch (err: any) {
    // Re-throw the original Error object to preserve specific error messages
    if (err instanceof Error) {
      throw err;
    }

    // Fallback for non-Error exceptions
    throw new Error('An unknown network error occurred');
  }
}