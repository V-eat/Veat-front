import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminService, AdminStats, AdminUser, AdminRestaurant, AdminOrder, AdminReview } from '@/api/services/admin.service';

export type { AdminStats, AdminUser, AdminRestaurant, AdminOrder, AdminReview };

// ─── Stats ────────────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getStats(),
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getUsers(),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AdminUser['role'] }) =>
      adminService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Rôle mis à jour');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erreur lors de la mise à jour du rôle');
    },
  });
}

// ─── Restaurants ──────────────────────────────────────────────────────────────

export function useAdminRestaurants() {
  return useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => adminService.getRestaurants(),
  });
}

export function useApproveRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (restaurantId: string) => adminService.approveRestaurant(restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Restaurant approuvé — il est maintenant visible sur la plateforme');
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de l'approbation");
    },
  });
}

export function useRejectRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, reason }: { restaurantId: string; reason: string }) =>
      adminService.rejectRestaurant(restaurantId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      toast.success('Restaurant rejeté');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erreur lors du rejet');
    },
  });
}

export function useToggleRestaurantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, isActive }: { restaurantId: string; isActive: boolean }) =>
      isActive
        ? adminService.approveRestaurant(restaurantId)
        : adminService.rejectRestaurant(restaurantId, 'Désactivé par un administrateur'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      toast.success('Statut du restaurant mis à jour');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    },
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function useAdminOrders() {
  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => adminService.getOrders(),
  });
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export function useAdminReviews() {
  return useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => adminService.getReviews(),
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => adminService.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Avis supprimé');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erreur lors de la suppression');
    },
  });
}
