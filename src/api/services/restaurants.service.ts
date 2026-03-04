/**
 * Service de gestion des restaurants
 * Appelle le backend V'EAT (Express + Supabase) au lieu de Supabase directement.
 */

import { api } from '@/api/client';
import type { Restaurant } from '@/types';

export type { Restaurant };

export interface RestaurantFilters {
  cuisineType?: string;
  priceRange?: number;
  search?: string;
}

// DB row (snake_case) returned by the backend
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
  opening_hours: Record<string, { open: string; close: string; isClosed?: boolean }>;
  preparation_time: number;
  rating: number;
  review_count: number;
  price_range: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapRestaurant(db: DbRestaurant): Restaurant {
  return {
    id: db.id,
    name: db.name,
    description: db.description ?? '',
    imageUrl: db.image_url ?? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    cuisineType: db.cuisine_type ?? undefined,
    email: db.email,
    phone: db.phone,
    address: db.address,
    openingHours: db.opening_hours ?? {},
    preparationTime: db.preparation_time,
    rating: db.rating,
    reviewCount: db.review_count,
    priceRange: (db.price_range as 1 | 2 | 3) ?? 1,
    ownerId: db.owner_id,
  };
}

export async function getRestaurants(filters?: RestaurantFilters): Promise<Restaurant[]> {
  const params = new URLSearchParams();
  if (filters?.cuisineType) params.set('cuisine_type', filters.cuisineType);
  if (filters?.priceRange) params.set('price_range', String(filters.priceRange));
  if (filters?.search) params.set('search', filters.search);

  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await api.get<DbRestaurant[]>(`/restaurants${query}`);
  return data.map(mapRestaurant);
}

export async function getRestaurantById(id: string): Promise<Restaurant> {
  const data = await api.get<DbRestaurant>(`/restaurants/${id}`);
  return mapRestaurant(data);
}

export async function getRestaurantsByOwner(): Promise<Restaurant[]> {
  const data = await api.get<DbRestaurant[]>('/restaurants/mine');
  return data.map(mapRestaurant);
}

export async function createRestaurant(
  restaurant: Omit<DbRestaurant, 'id' | 'created_at' | 'updated_at' | 'rating' | 'review_count' | 'is_active'>
): Promise<Restaurant> {
  const data = await api.post<DbRestaurant>('/restaurants', restaurant);
  return mapRestaurant(data);
}

export async function updateRestaurant(id: string, updates: Partial<DbRestaurant>): Promise<Restaurant> {
  const data = await api.put<DbRestaurant>(`/restaurants/${id}`, updates);
  return mapRestaurant(data);
}

export async function deleteRestaurant(id: string): Promise<void> {
  await api.delete(`/restaurants/${id}`);
}

