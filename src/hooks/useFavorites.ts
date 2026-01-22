import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Favorite {
  id: string;
  user_id: string;
  restaurant_id: string;
  created_at: string;
}

export function useFavorites(userId: string | undefined) {
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*, restaurants(*)')
        .eq('user_id', userId!);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useIsFavorite(userId: string | undefined, restaurantId: string) {
  return useQuery({
    queryKey: ['is-favorite', userId, restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId!)
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!userId && !!restaurantId,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, restaurantId, isFavorite }: { 
      userId: string; 
      restaurantId: string; 
      isFavorite: boolean;
    }) => {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('restaurant_id', restaurantId);

        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: userId, restaurant_id: restaurantId });

        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['is-favorite', variables.userId, variables.restaurantId] });
      
      toast({
        title: data.action === 'added' ? 'Ajouté aux favoris' : 'Retiré des favoris',
        description: data.action === 'added' 
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
