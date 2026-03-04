/**
 * Hooks de gestion des commandes
 * 
 * Fournit des hooks React Query pour gérer les commandes :
 * - useOrders : récupère les commandes d'un utilisateur
 * - useRestaurantOrders : récupère les commandes d'un restaurant
 * - useCreateOrder : crée une nouvelle commande
 * - useUpdateOrderStatus : met à jour le statut d'une commande
 * - useCancelOrder : annule une commande
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as ordersService from '@/api/services/orders.service';

export type { Order, OrderItem } from '@/api/services/orders.service';

/**
 * Récupère les commandes d'un utilisateur
 */
export function useOrders(userId: string | undefined) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: () => ordersService.getUserOrders(),
    enabled: !!userId,
  });
}

/**
 * Récupère les commandes d'un restaurant
 */
export function useRestaurantOrders(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['restaurant-orders', restaurantId],
    queryFn: () => ordersService.getRestaurantOrders(restaurantId!),
    enabled: !!restaurantId,
  });
}

/**
 * Hook pour créer une nouvelle commande
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (order: Omit<ordersService.Order, 'id' | 'created_at' | 'updated_at' | 'status' | 'user_id'>) =>
      ordersService.createOrder(order),
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

/**
 * Hook pour mettre à jour le statut d'une commande
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ordersService.Order['status'] }) =>
      ordersService.updateOrderStatus(id, status),
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

/**
 * Hook pour annuler une commande
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (orderId: string) => ordersService.cancelOrder(orderId),
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
