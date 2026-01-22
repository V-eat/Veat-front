import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface AdminStats {
  totalUsers: number;
  totalRestaurants: number;
  totalOrders: number;
  totalRevenue: number;
  rushedFees: number;
  platformFees: number;
}

export interface UserWithRole {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  role: 'client' | 'restaurateur' | 'admin';
}

export interface AdminOrder {
  id: string;
  user_id: string | null;
  restaurant_id: string;
  items: any[];
  status: string;
  total_amount: number;
  arrival_time: string;
  is_rushed: boolean;
  created_at: string;
  restaurant_name?: string;
  user_email?: string;
}

// Fetch all users with their roles
export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || 'client',
        };
      });

      return usersWithRoles;
    },
  });
}

// Fetch all restaurants (including inactive)
export function useAdminRestaurants() {
  return useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// Fetch all orders
export function useAdminOrders() {
  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch restaurant names
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id, name');

      // Fetch user emails
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email');

      const enrichedOrders = orders.map(order => ({
        ...order,
        items: order.items as unknown as any[],
        restaurant_name: restaurants?.find(r => r.id === order.restaurant_id)?.name,
        user_email: profiles?.find(p => p.user_id === order.user_id)?.email,
      }));

      return enrichedOrders as AdminOrder[];
    },
  });
}

// Fetch all reviews
export function useAdminReviews() {
  return useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch restaurant names
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id, name');

      // Fetch user names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name');

      return reviews.map(review => ({
        ...review,
        restaurant_name: restaurants?.find(r => r.id === review.restaurant_id)?.name,
        user_name: profiles?.find(p => p.user_id === review.user_id)
          ? `${profiles.find(p => p.user_id === review.user_id)?.first_name} ${profiles.find(p => p.user_id === review.user_id)?.last_name}`
          : 'Utilisateur inconnu',
      }));
    },
  });
}

// Calculate admin statistics
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, restaurantsRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('restaurants').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('*'),
      ]);

      const orders = ordersRes.data || [];
      const completedOrders = orders.filter(o => o.status === 'completed');
      
      const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const rushedOrders = completedOrders.filter(o => o.is_rushed);
      const rushedFees = rushedOrders.length * 2.5; // 2.5€ per rushed order
      const platformFees = completedOrders.length * 1.5 + rushedOrders.length * 1; // 1.5€ service + 1€ from rushed

      return {
        totalUsers: usersRes.count || 0,
        totalRestaurants: restaurantsRes.count || 0,
        totalOrders: orders.length,
        totalRevenue,
        rushedFees,
        platformFees,
      } as AdminStats;
    },
  });
}

// Update user role
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'client' | 'restaurateur' | 'admin' }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Rôle mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du rôle');
    },
  });
}

// Toggle restaurant active status
export function useToggleRestaurantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ restaurantId, isActive }: { restaurantId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: isActive })
        .eq('id', restaurantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      toast.success('Statut du restaurant mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });
}

// Delete review
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Avis supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });
}
