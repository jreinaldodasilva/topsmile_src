import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

export interface PaymentData {
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  requiresAction?: boolean;
  clientSecret?: string;
}

export interface RetryState {
  canRetry: boolean;
  remainingTime: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
}

class PaymentService {
  private stripe: Promise<Stripe | null>;
  private retryStates: Map<string, RetryState> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_WINDOW_MINUTES = 10;
  private readonly RETRY_INTERVALS = [1000, 2000, 5000]; // milliseconds

  constructor() {
    this.stripe = stripePromise;
  }

  /**
   * Create a payment intent on the server
   */
  async createPaymentIntent(data: PaymentData): Promise<PaymentResult> {
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('topsmile_access_token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment intent'
      };
    }
  }

  /**
   * Confirm payment with retry logic
   */
  async confirmPayment(
    clientSecret: string,
    paymentMethod: StripeCardElement,
    retryId?: string
  ): Promise<PaymentResult> {
    const stripe = await this.stripe;
    if (!stripe) {
      return {
        success: false,
        error: 'Stripe not initialized'
      };
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: paymentMethod,
        }
      });

      if (error) {
        // Handle different error types
        if (error.type === 'card_error' || error.type === 'validation_error') {
          return {
            success: false,
            error: error.message
          };
        }

        // For network or API errors, enable retry
        if (error.type === 'api_connection_error' || error.type === 'api_error') {
          this.initializeRetryState(retryId || clientSecret);
          return {
            success: false,
            error: error.message,
            requiresAction: true,
            clientSecret
          };
        }

        return {
          success: false,
          error: error.message
        };
      }

      if (paymentIntent?.status === 'succeeded') {
        // Clear retry state on success
        if (retryId) {
          this.clearRetryState(retryId);
        }

        return {
          success: true,
          paymentIntentId: paymentIntent.id
        };
      }

      return {
        success: false,
        error: 'Payment failed'
      };
    } catch (error) {
      console.error('Payment confirmation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment confirmation failed'
      };
    }
  }

  /**
   * Retry payment with exponential backoff
   */
  async retryPayment(
    clientSecret: string,
    paymentMethod: StripeCardElement,
    retryId: string
  ): Promise<PaymentResult> {
    const retryState = this.retryStates.get(retryId);

    if (!retryState || !retryState.canRetry) {
      return {
        success: false,
        error: 'Retry not available or expired'
      };
    }

    if (retryState.retryCount >= this.MAX_RETRIES) {
      return {
        success: false,
        error: 'Maximum retry attempts exceeded'
      };
    }

    // Wait for retry interval
    const interval = this.RETRY_INTERVALS[retryState.retryCount] || 5000;
    await new Promise(resolve => setTimeout(resolve, interval));

    // Increment retry count
    retryState.retryCount++;
    this.retryStates.set(retryId, retryState);

    // Attempt payment again
    return this.confirmPayment(clientSecret, paymentMethod, retryId);
  }

  /**
   * Initialize retry state for a payment
   */
  private initializeRetryState(retryId: string): RetryState {
    const retryState: RetryState = {
      canRetry: true,
      remainingTime: this.RETRY_WINDOW_MINUTES * 60 * 1000, // Convert to milliseconds
      retryCount: 0,
      maxRetries: this.MAX_RETRIES
    };

    this.retryStates.set(retryId, retryState);

    // Set timeout to disable retry after window expires
    setTimeout(() => {
      const state = this.retryStates.get(retryId);
      if (state) {
        state.canRetry = false;
        state.remainingTime = 0;
        this.retryStates.set(retryId, state);
      }
    }, retryState.remainingTime);

    // Update remaining time every second
    const updateInterval = setInterval(() => {
      const state = this.retryStates.get(retryId);
      if (state && state.remainingTime > 0) {
        state.remainingTime -= 1000;
        if (state.remainingTime <= 0) {
          state.canRetry = false;
          clearInterval(updateInterval);
        }
        this.retryStates.set(retryId, state);
      } else {
        clearInterval(updateInterval);
      }
    }, 1000);

    return retryState;
  }

  /**
   * Get current retry state
   */
  getRetryState(retryId: string): RetryState | null {
    return this.retryStates.get(retryId) || null;
  }

  /**
   * Clear retry state
   */
  private clearRetryState(retryId: string): void {
    this.retryStates.delete(retryId);
  }

  /**
   * Format remaining time for display
   */
  formatRemainingTime(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / (60 * 1000));
    const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error: any): boolean {
    if (!error) return false;

    const retryableTypes = [
      'api_connection_error',
      'api_error',
      'network_error',
      'timeout_error'
    ];

    return retryableTypes.includes(error.type) ||
           error.message?.toLowerCase().includes('network') ||
           error.message?.toLowerCase().includes('connection') ||
           error.message?.toLowerCase().includes('timeout');
  }
}

export const paymentService = new PaymentService();
export default paymentService;
