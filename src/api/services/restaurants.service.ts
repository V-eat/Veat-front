/**
 * Service de gestion des restaurants
 * 
 * Gère toutes les opérations liées aux restaurants :
 * - Récupération de la liste des restaurants (avec filtres)
 * - Récupération d'un restaurant spécifique
 * - Récupération des restaurants d'un propriétaire
 * - Création d'un restaurant
 * - Mise à jour d'un restaurant
 */

import { supabase } from '@/integrations/supabase/client';

export interface Restaurant {
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

export interface RestaurantFilters {
  cuisineType?: string;
  priceRange?: number;
  search?: string;
}

/**
 * Récupère la liste des restaurants avec filtres optionnels
 */
export async function getRestaurants(filters?: RestaurantFilters): Promise<Restaurant[]> {
  let query = supabase
    .from('restaurants')
    .select('*')
    .eq('is_active', true)
    .order('rating', { ascending: false });

  if (filters?.cuisineType) {
    query = query.eq('cuisine_type', filters.cuisineType);
  }

  if (filters?.priceRange) {
    query = query.eq('price_range', filters.priceRange);
  }

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Restaurant[];
}

/**
 * Récupère un restaurant par son ID
 */
export async function getRestaurantById(id: string): Promise<Restaurant> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Restaurant;
}

/**
 * Récupère tous les restaurants d'un propriétaire
 */
export async function getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Restaurant[];
}

/**
 * Crée un nouveau restaurant
 */
export async function createRestaurant(
  restaurant: Omit<Restaurant, 'id' | 'created_at' | 'updated_at' | 'rating' | 'review_count'>
): Promise<Restaurant> {
  const { data, error } = await supabase
    .from('restaurants')
    .insert(restaurant)
    .select()
    .single();

  if (error) throw error;
  return data as Restaurant;
}

/**
 * Met à jour un restaurant existant
 */
export async function updateRestaurant(
  id: string,
  updates: Partial<Restaurant>
): Promise<Restaurant> {
  const { data, error } = await supabase
    .from('restaurants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Restaurant;
}

