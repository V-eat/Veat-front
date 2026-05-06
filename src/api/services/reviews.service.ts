/**
 * Service de gestion des avis
 * Appelle le backend V'EAT au lieu de Supabase directement.
 */

import { api } from '@/api/client';
import type { Review as AppReview } from '@/types';

export interface Review {
  id: string;
  user_id: string;
  restaurant_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}

export interface MyReview extends Review {}

export function mapReview(r: Review): AppReview {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    userId: r.user_id,
    userName: r.profiles
      ? `${r.profiles.first_name} ${r.profiles.last_name}`
      : 'Utilisateur',
    rating: r.rating,
    comment: r.comment ?? '',
    createdAt: r.created_at,
  };
}

export async function getRestaurantReviews(restaurantId: string): Promise<Review[]> {
  return api.get<Review[]>(`/restaurants/${restaurantId}/reviews`);
}

export async function getMyReviews(): Promise<MyReview[]> {
  return api.get<MyReview[]>('/reviews/me');
}

export async function createReview(
  restaurantId: string,
  review: { rating: number; comment?: string }
): Promise<Review> {
  return api.post<Review>(`/restaurants/${restaurantId}/reviews`, review);
}

export async function updateReview(
  id: string,
  updates: { rating: number; comment?: string }
): Promise<Review> {
  return api.put<Review>(`/reviews/${id}`, updates);
}

export async function deleteReview(id: string): Promise<void> {
  await api.delete(`/reviews/${id}`);
}

