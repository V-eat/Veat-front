import { useState, useMemo, useEffect, useRef } from 'react';
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
import { Button } from '@/components/ui/forms';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/useAuthContext';
import { useMyRestaurants } from '@/hooks/useRestaurants';
import { useRestaurantOrders, useUpdateOrderStatus, useCancelOrder } from '@/hooks/useOrders';
import { OrderManagementView } from '@/components/restaurant/OrderManagementView';
import { FullDashboardView } from '@/components/restaurant/FullDashboardView';
import type { Order, OrderStatus } from '@/types';
import type { Order as ApiOrder, OrderItem as ApiOrderItem } from '@/api/services/orders.service';

// Map backend order (snake_case) to frontend Order (@/types - camelCase)
function mapOrder(o: ApiOrder): Order {
  return {
    id: o.id,
    restaurantId: o.restaurant_id,
    userId: o.user_id ?? '',
    items: (o.items ?? []).map((item: ApiOrderItem) => ({
      menuItem: {
        id: item.menuItemId,
        restaurantId: o.restaurant_id,
        name: item.name,
        description: '',
        price: item.price,
        category: '',
        allergens: [],
        isAvailable: true,
      },
      quantity: item.quantity,
      specialInstructions: item.specialInstructions,
    })),
    status: o.status as OrderStatus,
    totalAmount: o.total_amount,
    arrivalTime: o.arrival_time,
    tableNumber: o.table_number ?? undefined,
    tableId: o.table_id ?? null,
    isRushed: o.is_rushed ?? false,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    virtual_tables: o.virtual_tables
      ? {
          id: o.virtual_tables.id,
          join_code: o.virtual_tables.join_code,
          table_number: o.virtual_tables.table_number ?? null,
        }
      : null,
  };
}

type ViewMode = 'orders' | 'dashboard';

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('orders');
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedOrdersRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const { data: myRestaurants = [] } = useMyRestaurants(user?.id);
  const myRestaurant = myRestaurants[0];

  const { data: rawOrders = [], refetch } = useRestaurantOrders(myRestaurant?.id);
  const updateStatus = useUpdateOrderStatus();
  const cancelOrderMutation = useCancelOrder();

  const orders: Order[] = useMemo(() => {
    const mapped = rawOrders.map(mapOrder);
    const groupedByTable = new Map<string, Order[]>();
    const standaloneOrders: Order[] = [];

    mapped.forEach((order) => {
      if (!order.tableId) {
        standaloneOrders.push(order);
        return;
      }

      const key = order.tableId;
      const existing = groupedByTable.get(key) ?? [];
      existing.push(order);
      groupedByTable.set(key, existing);
    });

    const statusPriority: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 1,
      preparing: 2,
      ready: 3,
      completed: 4,
      cancelled: 5,
    };

    const groupedOrders: Order[] = Array.from(groupedByTable.entries()).map(([tableId, tableOrders]) => {
      const itemsMap = new Map<string, Order['items'][number]>();

      tableOrders.forEach((order) => {
        order.items.forEach((item) => {
          const key = `${item.menuItem.id}::${item.specialInstructions || ''}`;
          const existing = itemsMap.get(key);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            itemsMap.set(key, {
              ...item,
              quantity: item.quantity,
            });
          }
        });
      });

      const status = tableOrders
        .map((o) => o.status)
        .sort((a, b) => statusPriority[a] - statusPriority[b])[0];

      const totalAmount = tableOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const arrivalTime = tableOrders[0]?.arrivalTime ?? '';
      const isRushed = tableOrders.some((order) => order.isRushed);
      const tableNumber = tableOrders.find((o) => o.virtual_tables?.table_number != null)?.virtual_tables?.table_number
        ?? tableOrders[0]?.tableNumber;

      return {
        ...tableOrders[0],
        id: `table-${tableId}`,
        tableId,
        status,
        items: Array.from(itemsMap.values()),
        totalAmount,
        arrivalTime,
        isRushed,
        tableNumber: tableNumber ?? undefined,
        groupedOrderIds: tableOrders.map((o) => o.id),
      };
    });

    return [...groupedOrders, ...standaloneOrders].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [rawOrders]);

  // Stats for header
  const stats = useMemo(() => ({
    pending: orders.filter(o => o.status === 'pending').length,
    inProgress: orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length,
    ready: orders.filter(o => o.status === 'ready').length,
    rushed: orders.filter(o => o.isRushed && !['completed', 'cancelled'].includes(o.status)).length,
  }), [orders]);

  const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    pending: 'confirmed',
    confirmed: 'preparing',
    preparing: 'ready',
    ready: 'completed',
  };

  const handleUpdateStatus = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !nextStatus[order.status]) return;

    const targetIds = order.groupedOrderIds?.length ? order.groupedOrderIds : [orderId];

    Promise.all(
      targetIds.map((id) =>
        updateStatus.mutateAsync({ id, status: nextStatus[order.status]! })
      )
    ).then(() => {
      void refetch();
    });
  };

  const handleCancelOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const targetIds = order.groupedOrderIds?.length ? order.groupedOrderIds : [orderId];
    Promise.all(targetIds.map((id) => cancelOrderMutation.mutateAsync(id))).then(() => {
      void refetch();
    });
  };

  // Polling for near real-time order updates in management mode.
  useEffect(() => {
    if (!myRestaurant?.id) return;

    const intervalId = window.setInterval(() => {
      void refetch();
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [myRestaurant?.id, refetch]);

  const playOrderAlert = async (isRushed: boolean) => {
    if (typeof window === 'undefined') return;

    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const sequence = isRushed
      ? [
          { frequency: 900, duration: 0.09 },
          { frequency: 700, duration: 0.09 },
          { frequency: 1050, duration: 0.16 },
        ]
      : [
          { frequency: 720, duration: 0.1 },
          { frequency: 860, duration: 0.14 },
        ];

    let cursor = ctx.currentTime;

    for (const step of sequence) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = isRushed ? 'sawtooth' : 'sine';
      oscillator.frequency.setValueAtTime(step.frequency, cursor);

      gain.gain.setValueAtTime(0.0001, cursor);
      gain.gain.exponentialRampToValueAtTime(0.16, cursor + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, cursor + step.duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(cursor);
      oscillator.stop(cursor + step.duration + 0.02);
      cursor += step.duration + 0.04;
    }
  };

  // Play audio only when truly new orders appear after initial load.
  useEffect(() => {
    if (!myRestaurant?.id) return;

    const currentIds = new Set(rawOrders.map((order) => order.id));

    if (!hasInitializedOrdersRef.current) {
      knownOrderIdsRef.current = currentIds;
      hasInitializedOrdersRef.current = true;
      return;
    }

    const newOrders = rawOrders.filter((order) => !knownOrderIdsRef.current.has(order.id));

    if (newOrders.length > 0) {
      const hasRushedOrder = newOrders.some((order) => !!order.is_rushed);
      void playOrderAlert(hasRushedOrder);
    }

    knownOrderIdsRef.current = currentIds;
  }, [rawOrders, myRestaurant?.id]);

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
        <FullDashboardView
          orders={orders}
          restaurantId={myRestaurant?.id}
          restaurant={myRestaurant}
          openingHours={myRestaurant?.openingHours}
        />
      )}
    </div>
  );
}
