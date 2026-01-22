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
    queryFn: () => restaurantsService.getRestaurantsByOwner(ownerId!),
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
    mutationFn: (restaurant: Omit<restaurantsService.Restaurant, 'id' | 'created_at' | 'updated_at' | 'rating' | 'review_count'>) =>
      restaurantsService.createRestaurant(restaurant),
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

  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<restaurantsService.Restaurant> & { id: string }) =>
      restaurantsService.updateRestaurant(id, updates),
    onSuccess: (data) => {
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
