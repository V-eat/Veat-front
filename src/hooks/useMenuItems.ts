/**
 * Hooks de gestion des éléments de menu
 * 
 * Fournit des hooks React Query pour gérer les plats/éléments de menu :
 * - useMenuItems : récupère les éléments de menu d'un restaurant
 * - useCreateMenuItem : crée un nouvel élément de menu
 * - useUpdateMenuItem : met à jour un élément de menu
 * - useDeleteMenuItem : supprime un élément de menu
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as menuItemsService from '@/api/services/menuItems.service';

export type { MenuItem } from '@/api/services/menuItems.service';

/**
 * Récupère les éléments de menu d'un restaurant
 */
export function useMenuItems(restaurantId: string) {
  return useQuery({
    queryKey: ['menu-items', restaurantId],
    queryFn: () => menuItemsService.getMenuItems(restaurantId),
    enabled: !!restaurantId,
  });
}

/**
 * Hook pour créer un nouvel élément de menu
 */
export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ restaurantId, ...menuItem }: menuItemsService.CreateMenuItemInput & { restaurantId: string }) =>
      menuItemsService.createMenuItem(restaurantId, menuItem),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', variables.restaurantId] });
      toast({
        title: 'Plat ajouté',
        description: 'Le plat a été ajouté à la carte.',
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
 * Hook pour mettre à jour un élément de menu
 */
export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...updates }: menuItemsService.UpdateMenuItemInput & { id: string }) =>
      menuItemsService.updateMenuItem(id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast({
        title: 'Plat mis à jour',
        description: 'Les modifications ont été enregistrées.',
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
 * Hook pour supprimer un élément de menu
 */
export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, restaurantId }: { id: string; restaurantId: string }) =>
      menuItemsService.deleteMenuItem(id).then(() => ({ id, restaurantId })),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', data.restaurantId] });
      toast({
        title: 'Plat supprimé',
        description: 'Le plat a été retiré de la carte.',
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
