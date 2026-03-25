/**
 * Hooks de gestion des restaurants
 * 
 * Fournit des hooks React Query pour gérer les restaurants :
 * - useRestaurants : récupère la liste des restaurants avec filtres
 * - useRestaurant : récupère un restaurant spécifique
 * - useMyRestaurants : récupère les restaurants d'un propriétaire
 * - useCreateRestaurant : crée un nouveau restaurant
 * - useUpdateRestaurant : met à jour un restaurant
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as restaurantsService from '@/api/services/restaurants.service';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';

export type { Restaurant } from '@/api/services/restaurants.service';
export type { RestaurantFilters } from '@/api/services/restaurants.service';

/**
 * Récupère la liste des restaurants avec filtres optionnels
 */
export function useRestaurants(filters?: restaurantsService.RestaurantFilters) {
  return useQuery({
    queryKey: ['restaurants', filters],
    queryFn: () => restaurantsService.getRestaurants(filters),
  });
}

/**
 * Récupère les restaurants avec isFavorite mergé depuis les favoris de l'utilisateur
 */
export function useRestaurantsWithFavorites(filters?: restaurantsService.RestaurantFilters) {
  const { user } = useAuth();
  const { data: restaurants, ...restaurantsQuery } = useRestaurants(filters);
  const { data: favorites } = useFavorites(user?.id);

  const favoriteIds = new Set((favorites ?? []).map((f: any) => f.id));
  const data = restaurants?.map((r) => ({ ...r, isFavorite: favoriteIds.has(r.id) }));

  return { ...restaurantsQuery, data };
}

/**
 * Récupère un restaurant par son ID
 */
export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => restaurantsService.getRestaurantById(id),
    enabled: !!id,
  });
}

/**
 * Récupère les restaurants d'un propriétaire
 */
export function useMyRestaurants(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['my-restaurants', ownerId],
    queryFn: () => restaurantsService.getRestaurantsByOwner(),
    enabled: !!ownerId,
  });
}

/**
 * Hook pour créer un nouveau restaurant
 */
export function useCreateRestaurant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (restaurant: Record<string, unknown>) =>
      restaurantsService.createRestaurant(restaurant as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['my-restaurants'] });
      toast({
        title: 'Restaurant créé',
        description: 'Votre restaurant a été ajouté avec succès.',
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
 * Hook pour mettre à jour un restaurant
 */
export function useUpdateRestaurant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mergeRestaurantInList = (
    list: restaurantsService.Restaurant[] | undefined,
    updated: restaurantsService.Restaurant
  ) => {
    if (!Array.isArray(list)) return list;
    return list.map((restaurant) =>
      restaurant.id === updated.id ? { ...restaurant, ...updated } : restaurant
    );
  };

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Record<string, unknown>) =>
      restaurantsService.updateRestaurant(id, updates as any),
    onSuccess: (data) => {
      queryClient.setQueriesData({ queryKey: ['restaurants'] }, (oldData: unknown) => {
        return mergeRestaurantInList(oldData as restaurantsService.Restaurant[] | undefined, data);
      });

      queryClient.setQueriesData({ queryKey: ['my-restaurants'] }, (oldData: unknown) => {
        return mergeRestaurantInList(oldData as restaurantsService.Restaurant[] | undefined, data);
      });

      queryClient.setQueryData(['restaurant', data.id], data);

      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant', data.id] });
      queryClient.invalidateQueries({ queryKey: ['my-restaurants'] });
      toast({
        title: 'Restaurant mis à jour',
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
