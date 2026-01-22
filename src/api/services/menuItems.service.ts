/**
 * Service de gestion des éléments de menu
 * 
 * Gère toutes les opérations liées aux plats/éléments de menu :
 * - Récupération des éléments d'un restaurant
 * - Création d'un élément de menu
 * - Mise à jour d'un élément de menu
 * - Suppression d'un élément de menu
 */

import { supabase } from '@/integrations/supabase/client';

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  allergens: string[];
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Récupère tous les éléments de menu d'un restaurant
 */
export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('category')
    .order('name');

  if (error) throw error;
  return data as MenuItem[];
}

/**
 * Crée un nouvel élément de menu
 */
export async function createMenuItem(
  menuItem: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>
): Promise<MenuItem> {
  const { data, error } = await supabase
    .from('menu_items')
    .insert(menuItem)
    .select()
    .single();

  if (error) throw error;
  return data as MenuItem;
}

/**
 * Met à jour un élément de menu existant
 */
export async function updateMenuItem(
  id: string,
  updates: Partial<MenuItem>
): Promise<MenuItem> {
  const { data, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as MenuItem;
}

/**
 * Supprime un élément de menu
 */
export async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

