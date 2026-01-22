import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Review {
  id: string;
  user_id: string;
  restaurant_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export function useReviews(restaurantId: string) {
  return useQuery({
    queryKey: ['reviews', restaurantId],
    queryFn: async () => {
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      
      // Fetch profiles separately
      const userIds = reviews.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return reviews.map(review => ({
        ...review,
        profiles: profileMap.get(review.user_id) || null,
      })) as Review[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (review: { user_id: string; restaurant_id: string; rating: number; comment?: string }) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
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

export function useUpdateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, rating, comment }: { id: string; rating: number; comment?: string }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({ rating, comment })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
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

export function useDeleteReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { restaurantId };
    },
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
