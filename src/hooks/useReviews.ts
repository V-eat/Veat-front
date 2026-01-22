/**
 * Hooks de gestion des avis
 * 
 * Fournit des hooks React Query pour gérer les avis clients :
 * - useReviews : récupère les avis d'un restaurant
 * - useCreateReview : crée un nouvel avis
 * - useUpdateReview : met à jour un avis
 * - useDeleteReview : supprime un avis
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as reviewsService from '@/api/services/reviews.service';

export type { Review } from '@/api/services/reviews.service';

/**
 * Récupère les avis d'un restaurant
 */
export function useReviews(restaurantId: string) {
  return useQuery({
    queryKey: ['reviews', restaurantId],
    queryFn: () => reviewsService.getRestaurantReviews(restaurantId),
    enabled: !!restaurantId,
  });
}

/**
 * Hook pour créer un nouvel avis
 */
export function useCreateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (review: { user_id: string; restaurant_id: string; rating: number; comment?: string }) =>
      reviewsService.createReview(review),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ['restaurant', data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      toast({
        title: 'Avis publié',
        description: 'Merci pour votre retour !',
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
 * Hook pour mettre à jour un avis
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, rating, comment }: { id: string; rating: number; comment?: string }) =>
      reviewsService.updateReview(id, { rating, comment }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ['restaurant', data.restaurant_id] });
      toast({
        title: 'Avis mis à jour',
        description: 'Votre avis a été modifié.',
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
 * Hook pour supprimer un avis
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, restaurantId }: { id: string; restaurantId: string }) =>
      reviewsService.deleteReview(id).then(() => ({ restaurantId })),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', data.restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['restaurant', data.restaurantId] });
      toast({
        title: 'Avis supprimé',
        description: 'Votre avis a été supprimé.',
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
