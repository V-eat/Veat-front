import { Order, Restaurant, MenuItem } from '@/types';
import { mockRestaurants, mockMenuItems } from './mockData';

// Extended mock orders for client dashboard
export const mockClientOrders: (Order & { restaurant: Restaurant })[] = [
  {
    id: 'ord-001',
    restaurantId: '1',
    userId: 'user1',
    items: [
      { menuItem: mockMenuItems['1'][2], quantity: 2 },
      { menuItem: mockMenuItems['1'][4], quantity: 1 },
    ],
    status: 'preparing',
    totalAmount: 56.50,
    arrivalTime: '19:30',
    tableNumber: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    restaurant: mockRestaurants[0],
  },
  {
    id: 'ord-002',
    restaurantId: '2',
    userId: 'user1',
    items: [
      { menuItem: mockMenuItems['2'][2], quantity: 1 },
      { menuItem: mockMenuItems['2'][4], quantity: 2 },
    ],
    status: 'confirmed',
    totalAmount: 54.00,
    arrivalTime: '20:15',
    tableNumber: 4,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    restaurant: mockRestaurants[1],
  },
  {
    id: 'ord-003',
    restaurantId: '3',
    userId: 'user1',
    items: [
      { menuItem: mockMenuItems['1'][0], quantity: 2 },
      { menuItem: mockMenuItems['1'][3], quantity: 2 },
    ],
    status: 'completed',
    totalAmount: 63.00,
    arrivalTime: '13:00',
    tableNumber: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    restaurant: mockRestaurants[2],
  },
  {
    id: 'ord-004',
    restaurantId: '1',
    userId: 'user1',
    items: [
      { menuItem: mockMenuItems['1'][1], quantity: 1 },
      { menuItem: mockMenuItems['1'][2], quantity: 1 },
      { menuItem: mockMenuItems['1'][5], quantity: 2 },
    ],
    status: 'completed',
    totalAmount: 53.00,
    arrivalTime: '20:00',
    tableNumber: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 45).toISOString(),
    restaurant: mockRestaurants[0],
  },
  {
    id: 'ord-005',
    restaurantId: '2',
    userId: 'user1',
    items: [
      { menuItem: mockMenuItems['2'][0], quantity: 2 },
      { menuItem: mockMenuItems['2'][5], quantity: 1 },
    ],
    status: 'completed',
    totalAmount: 25.00,
    arrivalTime: '12:30',
    tableNumber: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 + 1000 * 60 * 30).toISOString(),
    restaurant: mockRestaurants[1],
  },
  {
    id: 'ord-006',
    restaurantId: '4',
    userId: 'user1',
    items: [
      { menuItem: mockMenuItems['1'][2], quantity: 1 },
    ],
    status: 'cancelled',
    totalAmount: 24.00,
    arrivalTime: '19:00',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    restaurant: mockRestaurants[3],
  },
];

export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'En attente',
    color: 'bg-muted text-muted-foreground',
    description: 'Votre commande est en attente de confirmation',
  },
  confirmed: {
    label: 'Confirmée',
    color: 'bg-primary/10 text-primary',
    description: 'Le restaurant a confirmé votre commande',
  },
  preparing: {
    label: 'En préparation',
    color: 'bg-warning/10 text-warning',
    description: 'Vos plats sont en cours de préparation',
  },
  ready: {
    label: 'Prêt',
    color: 'bg-success/10 text-success',
    description: 'Vos plats sont prêts, rendez-vous au restaurant !',
  },
  completed: {
    label: 'Terminée',
    color: 'bg-muted text-muted-foreground',
    description: 'Commande terminée',
  },
  cancelled: {
    label: 'Annulée',
    color: 'bg-destructive/10 text-destructive',
    description: 'Cette commande a été annulée',
  },
};
