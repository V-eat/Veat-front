/**
 * Service de gestion des favoris
 * Appelle le backend V'EAT au lieu de Supabase directement.
 */

import { api } from '@/api/client';
import type { Restaurant } from '@/types';

interface DbRestaurant {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  cuisine_type: string | null;
  email: string;
  phone: string;
  address: string;
  opening_hours: Record<string, unknown>;
  preparation_time: number;
  rating: number;
  review_count: number;
  price_range: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  restaurant_id: string;
  created_at: string;
  restaurants?: DbRestaurant | null;
}

export function mapFavoriteToRestaurant(fav: Favorite): Restaurant | null {
  const r = fav.restaurants;
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    imageUrl: r.image_url ?? '',
    cuisineType: r.cuisine_type ?? undefined,
    email: r.email,
    phone: r.phone,
    address: r.address,
    openingHours: r.opening_hours as Record<string, { open: string; close: string }>,
    preparationTime: r.preparation_time,
    rating: r.rating,
    reviewCount: r.review_count,
    priceRange: (r.price_range as 1 | 2 | 3) ?? 1,
    ownerId: r.owner_id,
    isFavorite: true,
  };
}

export async function getUserFavorites(): Promise<Favorite[]> {
  return api.get<Favorite[]>('/favorites');
}

export async function isFavorite(restaurantId: string): Promise<boolean> {
  const data = await api.get<{ isFavorite: boolean }>(`/favorites/check/${restaurantId}`);
  return data.isFavorite;
}

export async function addFavorite(restaurantId: string): Promise<void> {
  await api.post('/favorites', { restaurant_id: restaurantId });
}

export async function removeFavorite(restaurantId: string): Promise<void> {
  await api.delete(`/favorites/${restaurantId}`);
}

export async function toggleFavorite(
  restaurantId: string,
  currentlyFavorited: boolean
): Promise<'added' | 'removed'> {
  if (currentlyFavorited) {
    await removeFavorite(restaurantId);
    return 'removed';
  } else {
    await addFavorite(restaurantId);
    return 'added';
  }
}
