/**
 * Service de gestion des éléments de menu
 * Appelle le backend V'EAT au lieu de Supabase directement.
 */

import { api } from '@/api/client';
import type { MenuItem, Allergen } from '@/types';

export type { MenuItem };

// DB row (snake_case) returned by the backend
interface DbMenuItem {
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

function mapMenuItem(db: DbMenuItem): MenuItem {
  return {
    id: db.id,
    restaurantId: db.restaurant_id,
    name: db.name,
    description: db.description ?? '',
    price: db.price,
    imageUrl: db.image_url ?? undefined,
    category: db.category,
    allergens: db.allergens as Allergen[],
    isAvailable: db.is_available,
  };
}

export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
  const data = await api.get<DbMenuItem[]>(`/restaurants/${restaurantId}/menu`);
  return data.map(mapMenuItem);
}

export async function createMenuItem(
  restaurantId: string,
  menuItem: Omit<DbMenuItem, 'id' | 'created_at' | 'updated_at' | 'restaurant_id'>
): Promise<MenuItem> {
  const data = await api.post<DbMenuItem>(`/restaurants/${restaurantId}/menu`, menuItem);
  return mapMenuItem(data);
}

export async function updateMenuItem(id: string, updates: Partial<DbMenuItem>): Promise<MenuItem> {
  const data = await api.put<DbMenuItem>(`/menu-items/${id}`, updates);
  return mapMenuItem(data);
}

export async function deleteMenuItem(id: string): Promise<void> {
  await api.delete(`/menu-items/${id}`);
}

