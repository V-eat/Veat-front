import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Clock,
  ChefHat,
  Package,
  Zap,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockOrders, mockMenuItems } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { OrderManagementView } from '@/components/restaurant/OrderManagementView';
import { FullDashboardView } from '@/components/restaurant/FullDashboardView';
import type { Order, OrderStatus } from '@/types';

// Extended orders for demo
const extendedOrders: Order[] = [
  ...mockOrders,
  {
    id: 'o3',
    restaurantId: '1',
    userId: 'user3',
    items: [
      { menuItem: mockMenuItems['1'][0], quantity: 1 },
      { menuItem: mockMenuItems['1'][1], quantity: 2 },
    ],
    status: 'pending',
    totalAmount: 38.00,
    arrivalTime: '19:45',
    tableNumber: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isRushed: true,
  },
  {
    id: 'o4',
    restaurantId: '1',
    userId: 'user4',
    items: [
      { menuItem: mockMenuItems['1'][3], quantity: 2 },
      { menuItem: mockMenuItems['1'][5], quantity: 1 },
    ],
    status: 'confirmed',
    totalAmount: 52.00,
    arrivalTime: '20:00',
    tableNumber: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'o5',
    restaurantId: '1',
    userId: 'user5',
    items: [
      { menuItem: mockMenuItems['1'][2], quantity: 3 },
    ],
    status: 'preparing',
    totalAmount: 45.00,
    arrivalTime: '19:30',
    tableNumber: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

type ViewMode = 'orders' | 'dashboard';

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, role } = useAuth();
  const [orders, setOrders] = useState<Order[]>(extendedOrders);
  const [viewMode, setViewMode] = useState<ViewMode>('orders');

  // Redirect if not restaurateur
  useEffect(() => {
    if (!loading && (!isAuthenticated || (role && role !== 'restaurateur' && role !== 'admin'))) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, role, navigate]);

  // Stats for header
  const stats = useMemo(() => ({
    pending: orders.filter(o => o.status === 'pending').length,
    inProgress: orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length,
    ready: orders.filter(o => o.status === 'ready').length,
    rushed: orders.filter(o => o.isRushed && !['completed', 'cancelled'].includes(o.status)).length,
  }), [orders]);

  const handleUpdateStatus = (orderId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId && nextStatus[order.status]) {
        return { ...order, status: nextStatus[order.status]!, updatedAt: new Date().toISOString() };
      }
      return order;
    }));
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return { ...order, status: 'cancelled' as OrderStatus, updatedAt: new Date().toISOString() };
      }
      return order;
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo & View Switcher */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">V</span>
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:block">V'EAT Pro</span>
            </Link>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'orders' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('orders')}
                className={cn(
                  "gap-2 transition-all",
                  viewMode === 'orders' && "shadow-sm"
                )}
              >
                <Smartphone className="h-4 w-4" />
                <span className="hidden sm:inline">Commandes</span>
              </Button>
              <Button
                variant={viewMode === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('dashboard')}
                className={cn(
                  "gap-2 transition-all",
                  viewMode === 'dashboard' && "shadow-sm"
                )}
              >
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">Gestion</span>
              </Button>
            </div>
          </div>
          
          {/* Quick Stats - Only in orders view */}
          {viewMode === 'orders' && (
            <div className="hidden lg:flex items-center gap-2 sm:gap-4">
              {stats.rushed > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 rounded-full animate-pulse">
                  <Zap className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-bold text-destructive">{stats.rushed} pressé{stats.rushed > 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 rounded-full">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-bold text-orange-600">{stats.pending}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 rounded-full">
                <ChefHat className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-600">{stats.inProgress}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 rounded-full">
                <Package className="h-4 w-4 text-green-600" />
                <span className="text-sm font-bold text-green-600">{stats.ready}</span>
              </div>
            </div>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {stats.pending > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {stats.pending}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Content based on view mode */}
      {viewMode === 'orders' ? (
        <OrderManagementView
          orders={orders}
          onUpdateStatus={handleUpdateStatus}
          onCancelOrder={handleCancelOrder}
        />
      ) : (
        <FullDashboardView orders={orders} />
      )}
    </div>
  );
}
