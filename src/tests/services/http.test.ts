import { request, logout, hasTokens, getAccessToken, getRefreshToken, API_BASE_URL } from '../../services/http';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('http service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    localStorageMock.clear();
    jest.clearAllTimers();
  });

  describe('request function', () => {
    describe('successful requests', () => {
      it('should make successful GET request without auth', async () => {
        const mockResponse = { data: { message: 'success' } };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify(mockResponse)
        } as any);

        const result = await request('/test-endpoint', { auth: false });

        expect(result.ok).toBe(true);
        expect(result.status).toBe(200);
        expect(result.data).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/test-endpoint`,
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            })
          })
        );
      });

      it('should make successful POST request with auth', async () => {
        const mockResponse = { data: { id: '123' } };
        const accessToken = 'test-access-token';
        localStorageMock.setItem('topsmile_access_token', accessToken);

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          text: async () => JSON.stringify(mockResponse)
        } as any);

        const result = await request('/test-endpoint', {
          method: 'POST',
          body: JSON.stringify({ name: 'test' })
        });

        expect(result.ok).toBe(true);
        expect(result.data).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/test-endpoint`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }),
            body: JSON.stringify({ name: 'test' })
          })
        );
      });

      it('should handle full URL endpoints', async () => {
        const fullUrl = 'https://external-api.com/test';
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ data: 'external' })
        } as any);

        await request(fullUrl);

        expect(mockFetch).toHaveBeenCalledWith(fullUrl, expect.any(Object));
      });
    });

    describe('error handling', () => {
      it('should handle HTTP errors', async () => {
        const errorResponse = { message: 'Not found' };
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => JSON.stringify(errorResponse)
        } as any);

        const result = await request('/not-found');

        expect(result.ok).toBe(false);
        expect(result.status).toBe(404);
        expect(result.message).toBe('Not found');
      });

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        await expect(request('/network-error')).rejects.toThrow(
          'Unable to connect to server. Please check your internet connection.'
        );
      });

      it('should handle malformed JSON responses', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'not json'
        } as any);

        const result = await request('/malformed');

        expect(result.ok).toBe(true);
        expect(result.data).toEqual({ message: 'not json' });
      });
    });

    describe('token refresh', () => {
      it('should refresh token on 401 and retry request', async () => {
        const expiredToken = 'expired-token';
        const newToken = 'new-access-token';
        const refreshToken = 'refresh-token';

        localStorageMock.setItem('topsmile_access_token', expiredToken);
        localStorageMock.setItem('topsmile_refresh_token', refreshToken);

        // First call returns 401
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: async () => JSON.stringify({ message: 'Unauthorized' })
        } as any);

        // Refresh call succeeds
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            data: { accessToken: newToken, refreshToken: 'new-refresh' }
          })
        } as any);

        // Retry call succeeds
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ data: { success: true } })
        } as any);

        const result = await request('/protected-endpoint');

        expect(result.ok).toBe(true);
        expect(localStorageMock.getItem('topsmile_access_token')).toBe(newToken);
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });

      it('should handle refresh failure', async () => {
        localStorageMock.setItem('topsmile_access_token', 'expired');
        localStorageMock.setItem('topsmile_refresh_token', 'refresh');

        // Original request fails
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: async () => JSON.stringify({ message: 'Unauthorized' })
        } as any);

        // Refresh fails
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: async () => JSON.stringify({ message: 'Invalid refresh token' })
        } as any);

        const result = await request('/protected-endpoint');

        expect(result.ok).toBe(false);
        expect(localStorageMock.getItem('topsmile_access_token')).toBeNull();
        expect(localStorageMock.getItem('topsmile_refresh_token')).toBeNull();
      });

      it('should handle concurrent refresh requests', async () => {
        localStorageMock.setItem('topsmile_access_token', 'expired');
        localStorageMock.setItem('topsmile_refresh_token', 'refresh');

        // Both requests get 401
        mockFetch.mockResolvedValue({
          ok: false,
          status: 401,
          text: async () => JSON.stringify({ message: 'Unauthorized' })
        } as any);

        // Refresh call
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            data: { accessToken: 'new-token', refreshToken: 'new-refresh' }
          })
        } as any);

        // Two retry calls succeed
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ data: { success: true } })
        } as any);

        // Make two concurrent requests
        const [result1, result2] = await Promise.all([
          request('/endpoint1'),
          request('/endpoint2')
        ]);

        expect(result1.ok).toBe(true);
        expect(result2.ok).toBe(true);
        // Should only call refresh once
        expect(mockFetch).toHaveBeenCalledTimes(4); // 2 initial + 1 refresh + 2 retry
      });
    });
  });

  describe('logout function', () => {
    it('should clear local tokens and notify backend', async () => {
      const refreshToken = 'test-refresh-token';
      localStorageMock.setItem('topsmile_access_token', 'access-token');
      localStorageMock.setItem('topsmile_refresh_token', refreshToken);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true })
      } as any);

      await logout();

      expect(localStorageMock.getItem('topsmile_access_token')).toBeNull();
      expect(localStorageMock.getItem('topsmile_refresh_token')).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/auth/logout`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refreshToken })
        })
      );
    });

    it('should handle logout with provided refresh token', async () => {
      const customRefreshToken = 'custom-refresh';
      localStorageMock.setItem('topsmile_access_token', 'access-token');
      localStorageMock.setItem('topsmile_refresh_token', 'local-refresh');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true })
      } as any);

      await logout(customRefreshToken);

      expect(localStorageMock.getItem('topsmile_access_token')).toBeNull();
      expect(localStorageMock.getItem('topsmile_refresh_token')).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ refreshToken: customRefreshToken })
        })
      );
    });

    it('should handle backend logout failure gracefully', async () => {
      localStorageMock.setItem('topsmile_access_token', 'access-token');
      localStorageMock.setItem('topsmile_refresh_token', 'refresh-token');

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw
      await expect(logout()).resolves.not.toThrow();

      // Tokens should still be cleared
      expect(localStorageMock.getItem('topsmile_access_token')).toBeNull();
      expect(localStorageMock.getItem('topsmile_refresh_token')).toBeNull();
    });
  });

  describe('token utility functions', () => {
    it('hasTokens should return true when both tokens exist', () => {
      localStorageMock.setItem('topsmile_access_token', 'access');
      localStorageMock.setItem('topsmile_refresh_token', 'refresh');

      expect(hasTokens()).toBe(true);
    });

    it('hasTokens should return false when access token is missing', () => {
      localStorageMock.setItem('topsmile_refresh_token', 'refresh');

      expect(hasTokens()).toBe(false);
    });

    it('hasTokens should return false when refresh token is missing', () => {
      localStorageMock.setItem('topsmile_access_token', 'access');

      expect(hasTokens()).toBe(false);
    });

    it('getAccessToken should return the access token', () => {
      const token = 'test-access-token';
      localStorageMock.setItem('topsmile_access_token', token);

      expect(getAccessToken()).toBe(token);
    });

    it('getRefreshToken should return the refresh token', () => {
      const token = 'test-refresh-token';
      localStorageMock.setItem('topsmile_refresh_token', token);

      expect(getRefreshToken()).toBe(token);
    });

    it('should return null when tokens do not exist', () => {
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });
  });
});
