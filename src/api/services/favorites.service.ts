/**
 * Service de gestion des favoris
 * 
 * Gère toutes les opérations liées aux restaurants favoris :
 * - Récupération des favoris d'un utilisateur
 * - Vérification si un restaurant est en favoris
 * - Ajout/Suppression d'un favori
 */

import { supabase } from '@/integrations/supabase/client';

export interface Favorite {
  id: string;
  user_id: string;
  restaurant_id: string;
  created_at: string;
}

/**
 * Récupère tous les favoris d'un utilisateur avec les données des restaurants
 */
export async function getUserFavorites(userId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, restaurants(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

/**
 * Vérifie si un restaurant est dans les favoris d'un utilisateur
 */
export async function isFavorite(userId: string, restaurantId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

/**
 * Ajoute un restaurant aux favoris
 */
export async function addFavorite(userId: string, restaurantId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, restaurant_id: restaurantId });

  if (error) throw error;
}

/**
 * Supprime un restaurant des favoris
 */
export async function removeFavorite(userId: string, restaurantId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId);

  if (error) throw error;
}

/**
 * Bascule l'état favori d'un restaurant (ajoute s'il n'est pas favori, retire s'il l'est)
 */
export async function toggleFavorite(
  userId: string,
  restaurantId: string,
  isFavorite: boolean
): Promise<'added' | 'removed'> {
  if (isFavorite) {
    await removeFavorite(userId, restaurantId);
    return 'removed';
  } else {
    await addFavorite(userId, restaurantId);
    return 'added';
  }
}

