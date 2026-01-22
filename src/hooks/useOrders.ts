import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export function useOrders(userId: string | undefined) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse items from JSONB
      return data.map(order => ({
        ...order,
        items: order.items as unknown as OrderItem[],
      })) as Order[];
    },
    enabled: !!userId,
  });
}

export function useRestaurantOrders(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['restaurant-orders', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(order => ({
        ...order,
        items: order.items as unknown as OrderItem[],
      })) as Order[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: string }) => {
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Commande envoyée',
        description: 'Votre commande a été transmise au restaurant.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order['status'] }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] });
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de la commande a été modifié.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Commande annulée',
        description: 'Votre commande a été annulée.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
