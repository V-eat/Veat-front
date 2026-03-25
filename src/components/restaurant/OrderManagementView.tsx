import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Check,
  ChefHat,
  X,
  Zap,
  ArrowRight,
  CheckCircle2,
  Timer,
  Package,
  AlertTriangle,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/forms';
import { Card, CardContent } from '@/components/ui/data-display';
import { Badge } from '@/components/ui/data-display';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/data-display';
import { ScrollArea } from '@/components/ui/layout';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: 'En attente', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock },
  confirmed: { label: 'Confirmée', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: CheckCircle2 },
  preparing: { label: 'En préparation', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: ChefHat },
  ready: { label: 'Prête', color: 'text-green-600', bgColor: 'bg-green-100', icon: Package },
  completed: { label: 'Terminée', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Check },
  cancelled: { label: 'Annulée', color: 'text-red-600', bgColor: 'bg-red-100', icon: X },
};

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

interface OrderManagementViewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
}

export function OrderManagementView({ orders, onUpdateStatus, onCancelOrder }: OrderManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'ready' | 'completed'>('active');

  // Filter orders by status
  const activeOrders = useMemo(() => 
    orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status))
      .sort((a, b) => {
        if (a.isRushed && !b.isRushed) return -1;
        if (!a.isRushed && b.isRushed) return 1;
        const priority: Record<string, number> = { pending: 0, confirmed: 1, preparing: 2 };
        return priority[a.status] - priority[b.status];
      }),
    [orders]
  );

  const readyOrders = useMemo(() => 
    orders.filter(o => o.status === 'ready'),
    [orders]
  );

  const completedOrders = useMemo(() => 
    orders.filter(o => ['completed', 'cancelled'].includes(o.status)),
    [orders]
  );

  // Aggregate items to prepare
  const itemsToPrepare = useMemo(() => {
    const itemsMap = new Map<string, { name: string; quantity: number; orders: string[] }>();
    
    activeOrders
      .filter(o => o.status === 'confirmed' || o.status === 'preparing')
      .forEach(order => {
        order.items.forEach(item => {
          const key = item.menuItem.id;
          const existing = itemsMap.get(key);
          if (existing) {
            existing.quantity += item.quantity;
            existing.orders.push(order.id);
          } else {
            itemsMap.set(key, {
              name: item.menuItem.name,
              quantity: item.quantity,
              orders: [order.id],
            });
          }
        });
      });
    
    return Array.from(itemsMap.values()).sort((a, b) => b.quantity - a.quantity);
  }, [activeOrders]);

  // Stats
  const stats = useMemo(() => ({
    pending: orders.filter(o => o.status === 'pending').length,
    inProgress: orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length,
    ready: orders.filter(o => o.status === 'ready').length,
    rushed: orders.filter(o => o.isRushed && !['completed', 'cancelled'].includes(o.status)).length,
  }), [orders]);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      {/* Quick Stats Bar */}
      <div className="lg:hidden flex items-center justify-center gap-2 p-2 bg-card border-b border-border">
        {stats.rushed > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 rounded-full animate-pulse">
            <Zap className="h-4 w-4 text-destructive" />
            <span className="text-sm font-bold text-destructive">{stats.rushed}</span>
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

      {/* Orders Panel */}
      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="h-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="active" className="text-base py-3">
              🔥 En cours ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="ready" className="text-base py-3">
              ✅ Prêtes ({readyOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-base py-3">
              📋 Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0">
            <ScrollArea className="h-[calc(100vh-14rem)] lg:h-[calc(100vh-12rem)]">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {activeOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={onUpdateStatus}
                      onCancel={onCancelOrder}
                    />
                  ))}
                </AnimatePresence>
                {activeOrders.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl font-medium text-muted-foreground">Aucune commande en cours</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ready" className="mt-0">
            <ScrollArea className="h-[calc(100vh-14rem)] lg:h-[calc(100vh-12rem)]">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {readyOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={onUpdateStatus}
                      onCancel={onCancelOrder}
                    />
                  ))}
                </AnimatePresence>
                {readyOrders.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl font-medium text-muted-foreground">Aucune commande prête</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            <ScrollArea className="h-[calc(100vh-14rem)] lg:h-[calc(100vh-12rem)]">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {completedOrders.slice(0, 10).map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={onUpdateStatus}
                    onCancel={onCancelOrder}
                    readonly
                  />
                ))}
                {completedOrders.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Check className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl font-medium text-muted-foreground">Aucune commande terminée</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Items to Prepare Panel */}
      <div className="lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            À préparer
          </h2>
          <p className="text-sm text-muted-foreground">Récapitulatif des plats à cuisiner</p>
        </div>
        <ScrollArea className="h-64 lg:h-[calc(100vh-10rem)]">
          <div className="p-4 space-y-2">
            {itemsToPrepare.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-accent/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
                    {item.quantity}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.orders.length} commande{item.orders.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            {itemsToPrepare.length === 0 && (
              <div className="text-center py-8">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-muted-foreground">Tout est prêt !</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// Order Card Component
function OrderCard({ 
  order, 
  onUpdateStatus, 
  onCancel,
  readonly = false 
}: { 
  order: Order; 
  onUpdateStatus: (id: string) => void;
  onCancel: (id: string) => void;
  readonly?: boolean;
}) {
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;
  const canAdvance = !readonly && nextStatus[order.status];
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "relative",
        order.isRushed && !readonly && "ring-2 ring-destructive ring-offset-2"
      )}
    >
      <Card className={cn(
        "overflow-hidden transition-shadow hover:shadow-lg",
        order.status === 'ready' && "border-green-500 border-2"
      )}>
        <div className={cn("px-4 py-3 flex items-center justify-between", status.bgColor)}>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">#{order.tableNumber || '?'}</span>
            {order.isRushed && (
              <Badge variant="destructive" className="animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                PRESSÉ
              </Badge>
            )}
          </div>
          <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full", status.bgColor, status.color)}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{status.label}</span>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-muted flex items-center justify-center font-bold text-xs">
                    {item.quantity}
                  </span>
                  <span className="font-medium">{item.menuItem.name}</span>
                </span>
              </div>
            ))}
          </div>

          {order.items.some(item => item.specialInstructions) && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                {order.items.filter(item => item.specialInstructions).map(item => item.specialInstructions).join(', ')}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="text-sm text-muted-foreground">
              <Timer className="h-4 w-4 inline mr-1" />
              Arrivée {order.arrivalTime}
            </div>
            <span className="font-bold text-lg">{order.totalAmount.toFixed(2)} €</span>
          </div>

          {order.virtual_tables && (
            <div className="flex items-center gap-1.5 pt-1 text-xs text-primary font-medium">
              <Users className="h-3 w-3" />
              Table groupe : <span className="font-mono tracking-widest">{order.virtual_tables.join_code}</span>
            </div>
          )}

          {!readonly && (
            <div className="flex gap-2 pt-2">
              {order.status === 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onCancel(order.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
              )}
              {canAdvance && (
                <Button
                  variant="hero"
                  className="flex-1 h-12 text-base"
                  onClick={() => onUpdateStatus(order.id)}
                >
                  {order.status === 'pending' && 'Confirmer'}
                  {order.status === 'confirmed' && 'En cuisine'}
                  {order.status === 'preparing' && 'Prête !'}
                  {order.status === 'ready' && 'Servie'}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
