import { api } from '../client';

export interface AdminStats {
  totalUsers: number;
  totalRestaurants: number;
  totalOrders: number;
  totalRevenue: number;
  rushedFees: number;
  platformFees: number;
}

export interface AdminUser {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'client' | 'restaurateur' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface AdminRestaurant {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  cuisine_type: string | null;
  image_url: string | null;
  rating: number;
  review_count: number;
  is_active: boolean;
  siret: string | null;
  kbis_document_url: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_comment: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
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
  restaurants?: { id: string; name: string } | null;
  profiles?: { user_id: string; email: string; first_name: string; last_name: string } | null;
}

export interface AdminReview {
  id: string;
  user_id: string;
  restaurant_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  restaurants?: { id: string; name: string } | null;
  profiles?: { user_id: string; first_name: string; last_name: string } | null;
}

export const adminService = {
  getStats: () => api.get<AdminStats>('/admin/stats'),
  getUsers: () => api.get<AdminUser[]>('/admin/users'),
  updateUserRole: (userId: string, role: AdminUser['role']) =>
    api.put<AdminUser>(`/admin/users/${userId}/role`, { role }),
  getRestaurants: () => api.get<AdminRestaurant[]>('/admin/restaurants'),
  approveRestaurant: (id: string) =>
    api.patch<AdminRestaurant>(`/admin/restaurants/${id}/approve`, {}),
  rejectRestaurant: (id: string, reason: string) =>
    api.patch<AdminRestaurant>(`/admin/restaurants/${id}/reject`, { reason }),
  getOrders: () => api.get<AdminOrder[]>('/admin/orders'),
  getReviews: () => api.get<AdminReview[]>('/admin/reviews'),
  deleteReview: (id: string) => api.delete<void>(`/admin/reviews/${id}`),
};
