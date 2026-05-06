import { api } from '@/api/client';

export interface LoyaltyRestaurant {
  restaurant_id: string;
  restaurant_name: string;
  restaurant_image_url: string | null;
  orders_count: number;
  total_spent: number;
  points: number;
}

export interface LoyaltySummary {
  global: {
    points: number;
    total_spent: number;
    completed_orders_count: number;
    currentTier: string;
    nextTier: string | null;
    pointsToNextTier: number;
  };
  restaurants: LoyaltyRestaurant[];
}

export interface RecommendedRestaurant {
  id: string;
  name: string;
  cuisine_type: string | null;
  rating: number;
  review_count: number;
  image_url: string | null;
  score: number;
  reason: string;
}

export interface RecommendedMenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  category: string;
  price: number;
  reason: string;
}

export interface RecommendationPayload {
  restaurants: RecommendedRestaurant[];
  menu_items: RecommendedMenuItem[];
}

export interface DynamicPromotion {
  id: string;
  title: string;
  description: string;
  code: string;
  scope: 'global' | 'restaurant';
  restaurant_id: string | null;
  discount_percent: number;
  expires_at: string;
}

export interface PromotionValidationResult {
  promotion: DynamicPromotion & {
    min_order_amount?: number | null;
  };
  discountAmount: number;
  rawDiscountAmount?: number;
  cappedByPlatform?: boolean;
  discountedSubtotal: number;
}

export interface LoyaltyValidationResult {
  availablePoints: number;
  requestedPoints: number;
  pointsApplied: number;
  pointValueEur: number;
  discountAmount: number;
  cappedByPlatform: boolean;
  remainingPoints: number;
}

export async function getLoyaltySummary(): Promise<LoyaltySummary> {
  return api.get<LoyaltySummary>('/engagement/loyalty');
}

export async function getRecommendations(): Promise<RecommendationPayload> {
  return api.get<RecommendationPayload>('/engagement/recommendations');
}

export async function getDynamicPromotions(): Promise<DynamicPromotion[]> {
  return api.get<DynamicPromotion[]>('/engagement/promotions');
}

export async function validatePromotionCode(payload: {
  code: string;
  restaurantId: string;
  subtotal: number;
  maxPlatformDiscount: number;
}): Promise<PromotionValidationResult> {
  return api.post<PromotionValidationResult>('/engagement/promotions/validate', payload);
}

export async function validateLoyaltyUsage(payload: {
  pointsToUse: number;
  maxPlatformDiscount: number;
}): Promise<LoyaltyValidationResult> {
  return api.post<LoyaltyValidationResult>('/engagement/loyalty/validate', payload);
}
