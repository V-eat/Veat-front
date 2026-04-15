import { api } from '@/api/client';

export async function createPaymentIntent(amount: number, restaurantId: string): Promise<{ clientSecret: string }> {
  return api.post<{ clientSecret: string }>('/stripe/create-payment-intent', {
    amount,
    restaurantId,
  });
}

export interface StripeConnectStatus {
  hasAccount: boolean;
  accountId?: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
}

export async function getStripeConnectStatus(restaurantId: string): Promise<StripeConnectStatus> {
  return api.get<StripeConnectStatus>(`/stripe/connect/status/${restaurantId}`);
}

export async function createStripeConnectOnboardingLink(
  restaurantId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<{ url: string; accountId: string }> {
  return api.post<{ url: string; accountId: string }>('/stripe/connect/onboarding-link', {
    restaurantId,
    refreshUrl,
    returnUrl,
  });
}
