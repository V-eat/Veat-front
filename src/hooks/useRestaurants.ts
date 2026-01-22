import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  cuisine_type: string | null;
  email: string;
  phone: string;
  address: string;
  opening_hours: Record<string, { open: string; close: string; isClosed?: boolean }>;
  preparation_time: number;
  rating: number;
  review_count: number;
  price_range: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useRestaurants(filters?: {
  cuisineType?: string;
  priceRange?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ['restaurants', filters],
    queryFn: async () => {
      let query = supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (filters?.cuisineType) {
        query = query.eq('cuisine_type', filters.cuisineType);
      }

      if (filters?.priceRange) {
        query = query.eq('price_range', filters.priceRange);
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Restaurant[];
    },
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Restaurant;
    },
    enabled: !!id,
  });
}

export function useMyRestaurants(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['my-restaurants', ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', ownerId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Restaurant[];
    },
    enabled: !!ownerId,
  });
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (restaurant: Omit<Restaurant, 'id' | 'created_at' | 'updated_at' | 'rating' | 'review_count'>) => {
      const { data, error } = await supabase
        .from('restaurants')
        .insert(restaurant)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
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

export function useUpdateRestaurant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Restaurant> & { id: string }) => {
      const { data, error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
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
