/**
 * Service de gestion des commandes
 * Appelle le backend V'EAT au lieu de Supabase directement.
 */

import { api } from '@/api/client';

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
  table_id?: string | null;
  released_to_restaurant?: boolean;
  promotion_id?: string | null;
  promotion_code?: string | null;
  discount_amount?: number | null;
  loyalty_points_used?: number | null;
  loyalty_discount_amount?: number | null;
  created_at: string;
  updated_at: string;
  restaurants?: {
    id: string;
    name: string;
    image_url: string | null;
    address: string;
  } | null;
  virtual_tables?: {
    id: string;
    join_code: string;
    table_number: number | null;
    arrival_time?: string | null;
  } | null;
}

export async function getUserOrders(): Promise<Order[]> {
  return api.get<Order[]>('/orders');
}

export async function getRestaurantOrders(restaurantId: string): Promise<Order[]> {
  return api.get<Order[]>(`/orders/restaurant/${restaurantId}`);
}

export async function createOrder(
  order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'status' | 'user_id'>
): Promise<Order> {
  return api.post<Order>('/orders', order);
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status']
): Promise<Order> {
  return api.patch<Order>(`/orders/${orderId}/status`, { status });
}

export async function cancelOrder(orderId: string): Promise<Order> {
  return api.patch<Order>(`/orders/${orderId}/cancel`, {});
}

