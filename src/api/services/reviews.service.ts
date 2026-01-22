/**
 * Service de gestion des avis
 * 
 * Gère toutes les opérations liées aux avis clients :
 * - Récupération des avis d'un restaurant
 * - Création d'un avis
 * - Mise à jour d'un avis
 * - Suppression d'un avis
 */

import { supabase } from '@/integrations/supabase/client';

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
  };
}

/**
 * Récupère tous les avis d'un restaurant avec les profils utilisateurs
 */
export async function getRestaurantReviews(restaurantId: string): Promise<Review[]> {
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (reviewsError) throw reviewsError;
  
  // Récupère les profils des utilisateurs qui ont laissé des avis
  const userIds = reviews.map(r => r.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, avatar_url')
    .in('user_id', userIds);
  
  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
  
  return reviews.map(review => ({
    ...review,
    profiles: profileMap.get(review.user_id) || null,
  })) as Review[];
}

/**
 * Crée un nouvel avis
 */
export async function createReview(
  review: {
    user_id: string;
    restaurant_id: string;
    rating: number;
    comment?: string;
  }
): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

/**
 * Met à jour un avis existant
 */
export async function updateReview(
  id: string,
  updates: { rating: number; comment?: string }
): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

/**
 * Supprime un avis
 */
export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

