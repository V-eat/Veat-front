import { api } from '@/api/client';

export interface VirtualTable {
  id: string;
  restaurant_id: string;
  host_user_id: string;
  join_code: string;
  arrival_time: string | null;
  table_number: number | null;
  status: 'open' | 'closed';
  created_at: string;
  members?: Array<{
    user_id: string;
    profiles?: { first_name: string; last_name: string } | null;
  }>;
  orders?: any[];
}

export async function createTable(restaurantId: string, tableNumber?: number): Promise<VirtualTable> {
  return api.post<VirtualTable>('/tables', { restaurant_id: restaurantId, table_number: tableNumber });
}

export async function joinTable(joinCode: string): Promise<VirtualTable> {
  return api.post<VirtualTable>('/tables/join', { join_code: joinCode });
}

export async function getTable(id: string): Promise<VirtualTable> {
  return api.get<VirtualTable>(`/tables/${id}`);
}

export async function getTableByCode(code: string): Promise<VirtualTable> {
  return api.get<VirtualTable>(`/tables/code/${code}`);
}

export async function closeTable(id: string): Promise<VirtualTable> {
  return api.patch<VirtualTable>(`/tables/${id}/close`, {});
}

export async function updateTableArrivalTime(id: string, arrivalTime: string): Promise<VirtualTable> {
  return api.patch<VirtualTable>(`/tables/${id}/arrival-time`, { arrival_time: arrivalTime });
}

export async function leaveTable(id: string): Promise<void> {
  return api.delete(`/tables/${id}/leave`);
}
