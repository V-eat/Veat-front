/**
 * Service de gestion des éléments de menu
 * Appelle le backend V'EAT au lieu de Supabase directement.
 */

import { api } from '@/api/client';
import type { MenuItem, Allergen } from '@/types';

export type { MenuItem };

export type CreateMenuItemInput = Omit<MenuItem, 'id' | 'restaurantId'>;
export type UpdateMenuItemInput = Partial<CreateMenuItemInput>;

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

function mapCreateInputToDb(input: CreateMenuItemInput): Omit<DbMenuItem, 'id' | 'created_at' | 'updated_at' | 'restaurant_id'> {
  return {
    name: input.name,
    description: input.description || null,
    price: input.price,
    image_url: input.imageUrl ?? null,
    category: input.category,
    allergens: input.allergens as unknown as string[],
    is_available: input.isAvailable,
  };
}

function mapUpdateInputToDb(input: UpdateMenuItemInput): Partial<DbMenuItem> {
  const out: Partial<DbMenuItem> = {};
  if (input.name !== undefined) out.name = input.name;
  if (input.description !== undefined) out.description = input.description || null;
  if (input.price !== undefined) out.price = input.price;
  if (input.imageUrl !== undefined) out.image_url = input.imageUrl ?? null;
  if (input.category !== undefined) out.category = input.category;
  if (input.allergens !== undefined) out.allergens = input.allergens as unknown as string[];
  if (input.isAvailable !== undefined) out.is_available = input.isAvailable;
  return out;
}

export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
  const data = await api.get<DbMenuItem[]>(`/restaurants/${restaurantId}/menu`);
  return data.map(mapMenuItem);
}

export async function createMenuItem(
  restaurantId: string,
  menuItem: CreateMenuItemInput
): Promise<MenuItem> {
  const payload = mapCreateInputToDb(menuItem);
  const data = await api.post<DbMenuItem>(`/restaurants/${restaurantId}/menu`, payload);
  return mapMenuItem(data);
}

export async function updateMenuItem(id: string, updates: UpdateMenuItemInput): Promise<MenuItem> {
  const payload = mapUpdateInputToDb(updates);
  const data = await api.put<DbMenuItem>(`/menu-items/${id}`, payload);
  return mapMenuItem(data);
}

export async function deleteMenuItem(id: string): Promise<void> {
  await api.delete(`/menu-items/${id}`);
}

