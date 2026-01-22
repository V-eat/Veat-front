/**
 * Service de gestion des commandes
 * 
 * Gère toutes les opérations liées aux commandes :
 * - Récupération des commandes utilisateur
 * - Récupération des commandes restaurant
 * - Création de commande
 * - Mise à jour du statut d'une commande
 * - Annulation d'une commande
 */

import { supabase } from '@/integrations/supabase/client';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  restaurant_id: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  arrival_time: string;
  table_number: number | null;
  is_rushed: boolean;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Récupère toutes les commandes d'un utilisateur
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data.map(order => ({
    ...order,
    items: order.items as unknown as OrderItem[],
  })) as Order[];
}

/**
 * Récupère toutes les commandes d'un restaurant
 */
export async function getRestaurantOrders(restaurantId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data.map(order => ({
    ...order,
    items: order.items as unknown as OrderItem[],
  })) as Order[];
}

/**
 * Crée une nouvelle commande
 */
export async function createOrder(
  order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: string }
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: order.user_id,
      restaurant_id: order.restaurant_id,
      items: JSON.parse(JSON.stringify(order.items)),
      total_amount: order.total_amount,
      arrival_time: order.arrival_time,
      table_number: order.table_number,
      is_rushed: order.is_rushed,
      special_instructions: order.special_instructions,
      status: order.status || 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...(data as unknown as Omit<Order, "items"> & { items: unknown }),
    items: (data as any).items as unknown as OrderItem[],
  } as Order;
}

/**
 * Met à jour le statut d'une commande
 */
export async function updateOrderStatus(
  orderId: string,
  status: Order['status']
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return {
    ...(data as unknown as Omit<Order, "items"> & { items: unknown }),
    items: (data as any).items as unknown as OrderItem[],
  } as Order;
}

/**
 * Annule une commande
 */
export async function cancelOrder(orderId: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return {
    ...(data as unknown as Omit<Order, "items"> & { items: unknown }),
    items: (data as any).items as unknown as OrderItem[],
  } as Order;
}

