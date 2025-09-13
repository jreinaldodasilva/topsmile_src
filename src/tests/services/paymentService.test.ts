import { paymentService } from '../../services/paymentService';

const mockStripe = {
  confirmCardPayment: jest.fn()
};

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve(mockStripe))
}));

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

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

describe('paymentService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockStripe.confirmCardPayment.mockClear();
    localStorageMock.clear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createPaymentIntent', () => {
    it('should successfully create payment intent', async () => {
      const mockResponse = {
        success: true,
        clientSecret: 'pi_test_secret',
        paymentIntentId: 'pi_test_123'
      };

      localStorageMock.setItem('topsmile_access_token', 'test-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const paymentData = {
        amount: 1000,
        currency: 'usd',
        description: 'Test payment'
      };

      const result = await paymentService.createPaymentIntent(paymentData);

      expect(result.success).toBe(true);
      expect(result.clientSecret).toBe('pi_test_secret');
      expect(result.paymentIntentId).toBe('pi_test_123');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/payments/create-intent',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }),
          body: JSON.stringify(paymentData)
        })
      );
    });

    it('should handle creation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      } as Response);

      const result = await paymentService.createPaymentIntent({
        amount: 1000,
        currency: 'usd',
        description: 'Test payment'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP 400');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await paymentService.createPaymentIntent({
        amount: 1000,
        currency: 'usd',
        description: 'Test payment'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('confirmPayment', () => {
    const mockCardElement = {} as any;
    const clientSecret = 'pi_test_secret';

    it('should successfully confirm payment', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded'
      };

      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: null,
        paymentIntent: mockPaymentIntent
      });

      const result = await paymentService.confirmPayment(clientSecret, mockCardElement);

      expect(result.success).toBe(true);
      expect(result.paymentIntentId).toBe('pi_test_123');
      expect(mockStripe.confirmCardPayment).toHaveBeenCalledWith(clientSecret, {
        payment_method: {
          card: mockCardElement
        }
      });
    });

    it('should handle card errors', async () => {
      const cardError = {
        type: 'card_error',
        message: 'Your card was declined'
      };

      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: cardError,
        paymentIntent: null
      });

      const result = await paymentService.confirmPayment(clientSecret, mockCardElement);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Your card was declined');
      expect(result.requiresAction).toBeUndefined();
    });

    it('should handle validation errors', async () => {
      const validationError = {
        type: 'validation_error',
        message: 'Invalid card number'
      };

      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: validationError,
        paymentIntent: null
      });

      const result = await paymentService.confirmPayment(clientSecret, mockCardElement);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid card number');
    });

    it('should enable retry for API connection errors', async () => {
      const apiError = {
        type: 'api_connection_error',
        message: 'Network error'
      };

      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: apiError,
        paymentIntent: null
      });

      const result = await paymentService.confirmPayment(clientSecret, mockCardElement);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.requiresAction).toBe(true);
      expect(result.clientSecret).toBe(clientSecret);
    });

    it('should enable retry for API errors', async () => {
      const apiError = {
        type: 'api_error',
        message: 'Stripe API error'
      };

      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: apiError,
        paymentIntent: null
      });

      const result = await paymentService.confirmPayment(clientSecret, mockCardElement);

      expect(result.success).toBe(false);
      expect(result.requiresAction).toBe(true);
      expect(result.clientSecret).toBe(clientSecret);
    });

    it('should handle payment intent not succeeded', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'requires_payment_method'
      };

      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: null,
        paymentIntent: mockPaymentIntent
      });

      const result = await paymentService.confirmPayment(clientSecret, mockCardElement);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment failed');
    });

    it('should handle Stripe not initialized', async () => {
      // Mock loadStripe to return null
      const { loadStripe } = require('@stripe/stripe-js');
      loadStripe.mockResolvedValueOnce(null);

      const newPaymentService = new (require('../../services/paymentService').PaymentService)();

      const result = await newPaymentService.confirmPayment(clientSecret, mockCardElement);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Stripe not initialized');
    });

    it('should clear retry state on success', async () => {
      const retryId = 'test-retry-id';
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded'
      };

      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: null,
        paymentIntent: mockPaymentIntent
      });

      await paymentService.confirmPayment(clientSecret, mockCardElement, retryId);

      // Retry state should be cleared
      const retryState = paymentService.getRetryState(retryId);
      expect(retryState).toBeNull();
    });
  });

  describe('retryPayment', () => {
    const mockCardElement = {} as any;
    const clientSecret = 'pi_test_secret';
    const retryId = 'test-retry-id';

    beforeEach(() => {
      // Initialize retry state
      paymentService['initializeRetryState'](retryId);
    });

    it('should successfully retry payment', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded'
      };

      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: null,
        paymentIntent: mockPaymentIntent
      });

      const result = await paymentService.retryPayment(clientSecret, mockCardElement, retryId);

      expect(result.success).toBe(true);
      expect(result.paymentIntentId).toBe('pi_test_123');
    });

    it('should respect retry limits', async () => {
      // Set retry count to maximum
      const retryState = paymentService.getRetryState(retryId);
      if (retryState) {
        retryState.retryCount = 3; // Max retries
        paymentService['retryStates'].set(retryId, retryState);
      }

      const result = await paymentService.retryPayment(clientSecret, mockCardElement, retryId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Maximum retry attempts exceeded');
    });

    it('should handle expired retry window', async () => {
      // Expire retry state
      const retryState = paymentService.getRetryState(retryId);
      if (retryState) {
        retryState.canRetry = false;
        paymentService['retryStates'].set(retryId, retryState);
      }

      const result = await paymentService.retryPayment(clientSecret, mockCardElement, retryId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Retry not available or expired');
    });

    it('should handle non-existent retry state', async () => {
      const invalidRetryId = 'non-existent';

      const result = await paymentService.retryPayment(clientSecret, mockCardElement, invalidRetryId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Retry not available or expired');
    });

    it('should implement exponential backoff', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded'
      };

      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: null,
        paymentIntent: mockPaymentIntent
      });

      const startTime = Date.now();
      await paymentService.retryPayment(clientSecret, mockCardElement, retryId);
      const endTime = Date.now();

      // Should wait at least 1 second (first retry interval)
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('retry state management', () => {
    const retryId = 'test-retry-id';

    it('should initialize retry state correctly', () => {
      const retryState = paymentService['initializeRetryState'](retryId);

      expect(retryState.canRetry).toBe(true);
      expect(retryState.retryCount).toBe(0);
      expect(retryState.maxRetries).toBe(3);
      expect(retryState.remainingTime).toBe(10 * 60 * 1000); // 10 minutes
    });

    it('should get retry state', () => {
      paymentService['initializeRetryState'](retryId);
      const retryState = paymentService.getRetryState(retryId);

      expect(retryState).not.toBeNull();
      expect(retryState?.canRetry).toBe(true);
    });

    it('should return null for non-existent retry state', () => {
      const retryState = paymentService.getRetryState('non-existent');

      expect(retryState).toBeNull();
    });

    it('should disable retry after time window expires', () => {
      paymentService['initializeRetryState'](retryId);

      // Fast-forward time past the retry window
      jest.advanceTimersByTime(10 * 60 * 1000 + 1000); // 10 minutes + 1 second

      const retryState = paymentService.getRetryState(retryId);
      expect(retryState?.canRetry).toBe(false);
      expect(retryState?.remainingTime).toBe(0);
    });

    it('should update remaining time', () => {
      paymentService['initializeRetryState'](retryId);

      // Advance 5 seconds
      jest.advanceTimersByTime(5000);

      const retryState = paymentService.getRetryState(retryId);
      expect(retryState?.remainingTime).toBeLessThan(10 * 60 * 1000);
    });
  });

  describe('utility functions', () => {
    describe('formatRemainingTime', () => {
      it('should format time in minutes and seconds', () => {
        expect(paymentService.formatRemainingTime(125000)).toBe('2m 5s');
        expect(paymentService.formatRemainingTime(65000)).toBe('1m 5s');
        expect(paymentService.formatRemainingTime(59000)).toBe('0m 59s');
        expect(paymentService.formatRemainingTime(30000)).toBe('0m 30s');
        expect(paymentService.formatRemainingTime(5000)).toBe('5s');
        expect(paymentService.formatRemainingTime(1000)).toBe('1s');
      });
    });

    describe('isRetryableError', () => {
      it('should identify retryable error types', () => {
        expect(paymentService.isRetryableError({ type: 'api_connection_error' })).toBe(true);
        expect(paymentService.isRetryableError({ type: 'api_error' })).toBe(true);
        expect(paymentService.isRetryableError({ type: 'network_error' })).toBe(true);
        expect(paymentService.isRetryableError({ type: 'timeout_error' })).toBe(true);
      });

      it('should identify retryable error messages', () => {
        expect(paymentService.isRetryableError({ message: 'Network connection failed' })).toBe(true);
        expect(paymentService.isRetryableError({ message: 'Connection timeout' })).toBe(true);
        expect(paymentService.isRetryableError({ message: 'Network error occurred' })).toBe(true);
      });

      it('should return false for non-retryable errors', () => {
        expect(paymentService.isRetryableError({ type: 'card_error' })).toBe(false);
        expect(paymentService.isRetryableError({ type: 'validation_error' })).toBe(false);
        expect(paymentService.isRetryableError({ message: 'Invalid card number' })).toBe(false);
        expect(paymentService.isRetryableError(null)).toBe(false);
        expect(paymentService.isRetryableError({})).toBe(false);
      });
    });
  });
});
