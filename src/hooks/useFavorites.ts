/**
 * Hooks de gestion des favoris
 * 
 * Fournit des hooks React Query pour gérer les restaurants favoris :
 * - useFavorites : récupère les favoris d'un utilisateur
 * - useIsFavorite : vérifie si un restaurant est en favoris
 * - useToggleFavorite : ajoute ou retire un restaurant des favoris
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as favoritesService from '@/api/services/favorites.service';

export type { Favorite } from '@/api/services/favorites.service';

/**
 * Récupère les favoris d'un utilisateur
 */
export function useFavorites(userId: string | undefined) {
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: () => favoritesService.getUserFavorites(userId!),
    enabled: !!userId,
  });
}

/**
 * Vérifie si un restaurant est dans les favoris d'un utilisateur
 */
export function useIsFavorite(userId: string | undefined, restaurantId: string) {
  return useQuery({
    queryKey: ['is-favorite', userId, restaurantId],
    queryFn: () => favoritesService.isFavorite(userId!, restaurantId),
    enabled: !!userId && !!restaurantId,
  });
}

/**
 * Hook pour ajouter ou retirer un restaurant des favoris
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ userId, restaurantId, isFavorite }: { 
      userId: string; 
      restaurantId: string; 
      isFavorite: boolean;
    }) => favoritesService.toggleFavorite(userId, restaurantId, isFavorite),
    onSuccess: (action, variables) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['is-favorite', variables.userId, variables.restaurantId] });
      
      toast({
        title: action === 'added' ? 'Ajouté aux favoris' : 'Retiré des favoris',
        description: action === 'added' 
          ? 'Le restaurant a été ajouté à vos favoris.' 
          : 'Le restaurant a été retiré de vos favoris.',
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
