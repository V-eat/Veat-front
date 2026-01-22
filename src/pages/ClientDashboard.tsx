import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Clock,
  MapPin,
  ChevronRight,
  Star,
  TrendingUp,
  Calendar,
  Euro,
  RefreshCw,
  Heart,
  Bell,
  Settings,
  ChevronLeft,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Timer,
  Utensils,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { mockClientOrders, ORDER_STATUS_CONFIG } from '@/data/clientOrders';
import { mockRestaurants } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { OrderStatus } from '@/types';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Connectez-vous pour accéder à vos commandes
          </h2>
          <p className="text-muted-foreground mb-6">
            Suivez vos commandes en cours et consultez votre historique.
          </p>
          <Link to="/login?redirect=/my-orders">
            <Button variant="hero" size="lg">
              Se connecter
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Separate active and past orders
  const activeOrders = mockClientOrders.filter(
    o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  );
  const pastOrders = mockClientOrders.filter(
    o => ['completed', 'cancelled'].includes(o.status)
  );

  // Filter orders based on search
  const filteredPastOrders = pastOrders.filter(
    o =>
      o.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const stats = useMemo(() => {
    const completedOrders = mockClientOrders.filter(o => o.status === 'completed');
    const totalSpent = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = completedOrders.length > 0 ? totalSpent / completedOrders.length : 0;
    
    // Find favorite restaurant
    const restaurantCounts: Record<string, number> = {};
    completedOrders.forEach(o => {
      restaurantCounts[o.restaurantId] = (restaurantCounts[o.restaurantId] || 0) + 1;
    });
    const favoriteRestaurantId = Object.entries(restaurantCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const favoriteRestaurant = mockRestaurants.find(r => r.id === favoriteRestaurantId);

    return {
      totalOrders: completedOrders.length,
      totalSpent,
      avgOrderValue,
      favoriteRestaurant,
      activeOrdersCount: activeOrders.length,
    };
  }, []);

  const handleReorder = (order: typeof mockClientOrders[0]) => {
    order.items.forEach(item => {
      addItem(item.menuItem, item.quantity);
    });
    navigate(`/restaurant/${order.restaurantId}`);
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'confirmed':
        return CheckCircle2;
      case 'preparing':
        return Utensils;
      case 'ready':
        return Bell;
      case 'completed':
        return CheckCircle2;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => navigate(-1)} className="text-white/80 hover:text-white">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <span className="text-white/60">Retour</span>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              Mes commandes
            </h1>
            <p className="text-white/80">
              Suivez vos commandes en temps réel et retrouvez votre historique
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card className="shadow-veat">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">Commandes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-veat">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Euro className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalSpent.toFixed(0)}€</p>
                  <p className="text-xs text-muted-foreground">Dépensé</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-veat">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.avgOrderValue.toFixed(0)}€</p>
                  <p className="text-xs text-muted-foreground">Panier moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-veat">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Heart className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {stats.favoriteRestaurant?.name || '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Restaurant favori</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Orders Alert */}
        {activeOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-primary/30 bg-primary/5 shadow-veat">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center animate-pulse">
                    <Timer className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {activeOrders.length} commande{activeOrders.length > 1 ? 's' : ''} en cours
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Suivez l'avancement de vos commandes ci-dessous
                    </p>
                  </div>
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={() => setActiveTab('active')}
                  >
                    Voir
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="active" className="relative">
              En cours
              {activeOrders.length > 0 && (
                <span className="ml-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {activeOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          {/* Active Orders Tab */}
          <TabsContent value="active" className="space-y-4">
            {activeOrders.length > 0 ? (
              activeOrders.map((order, index) => {
                const StatusIcon = getStatusIcon(order.status);
                const statusConfig = ORDER_STATUS_CONFIG[order.status];

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="shadow-veat-lg overflow-hidden">
                      {/* Status Bar */}
                      <div className={cn('px-4 py-2', statusConfig.color)}>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          <span className="font-medium text-sm">{statusConfig.label}</span>
                          <span className="text-xs opacity-70">• {statusConfig.description}</span>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Restaurant Image */}
                          <Link to={`/restaurant/${order.restaurantId}`}>
                            <img
                              src={order.restaurant.imageUrl}
                              alt={order.restaurant.name}
                              className="w-20 h-20 rounded-xl object-cover"
                            />
                          </Link>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <Link
                                  to={`/restaurant/${order.restaurantId}`}
                                  className="font-semibold text-foreground hover:text-primary transition-colors"
                                >
                                  {order.restaurant.name}
                                </Link>
                                <p className="text-xs text-muted-foreground">
                                  Commande #{order.id.slice(-6).toUpperCase()}
                                </p>
                              </div>
                              <span className="font-bold text-primary">
                                {order.totalAmount.toFixed(2)} €
                              </span>
                            </div>

                            {/* Order Items Preview */}
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                              {order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                            </p>

                            {/* Info Row */}
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Arrivée: {order.arrivalTime}</span>
                              </div>
                              {order.tableNumber && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Utensils className="h-4 w-4" />
                                  <span>Table {order.tableNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex justify-between">
                            {['confirmed', 'preparing', 'ready'].map((step, i) => {
                              const stepOrder = ['pending', 'confirmed', 'preparing', 'ready'];
                              const currentIndex = stepOrder.indexOf(order.status);
                              const stepIndex = stepOrder.indexOf(step);
                              const isActive = stepIndex <= currentIndex;
                              const isCurrent = step === order.status;

                              return (
                                <div key={step} className="flex flex-col items-center flex-1">
                                  <div
                                    className={cn(
                                      'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                                      isActive
                                        ? 'gradient-hero text-white'
                                        : 'bg-muted text-muted-foreground',
                                      isCurrent && 'ring-4 ring-primary/20'
                                    )}
                                  >
                                    {React.createElement(getStatusIcon(step as OrderStatus), {
                                      className: 'h-4 w-4',
                                    })}
                                  </div>
                                  <span
                                    className={cn(
                                      'text-xs mt-1',
                                      isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                                    )}
                                  >
                                    {ORDER_STATUS_CONFIG[step as OrderStatus].label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                          <Link to={`/restaurant/${order.restaurantId}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Voir le restaurant
                            </Button>
                          </Link>
                          {order.status === 'pending' && (
                            <Button variant="ghost" size="sm" className="text-destructive">
                              Annuler
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Aucune commande en cours
                </h3>
                <p className="text-muted-foreground mb-4">
                  Explorez les restaurants et passez votre première commande !
                </p>
                <Link to="/restaurants">
                  <Button variant="hero">Explorer les restaurants</Button>
                </Link>
              </motion.div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher une commande..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12"
              />
            </div>

            {filteredPastOrders.length > 0 ? (
              filteredPastOrders.map((order, index) => {
                const StatusIcon = getStatusIcon(order.status);
                const statusConfig = ORDER_STATUS_CONFIG[order.status];

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="shadow-veat">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <Link to={`/restaurant/${order.restaurantId}`}>
                            <img
                              src={order.restaurant.imageUrl}
                              alt={order.restaurant.name}
                              className="w-16 h-16 rounded-xl object-cover"
                            />
                          </Link>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <Link
                                  to={`/restaurant/${order.restaurantId}`}
                                  className="font-semibold text-foreground hover:text-primary transition-colors"
                                >
                                  {order.restaurant.name}
                                </Link>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span
                                    className={cn(
                                      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                                      statusConfig.color
                                    )}
                                  >
                                    <StatusIcon className="h-3 w-3" />
                                    {statusConfig.label}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(order.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <span className="font-bold text-foreground">
                                {order.totalAmount.toFixed(2)} €
                              </span>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                              {order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                            </p>

                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleReorder(order)}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Recommander
                              </Button>
                              <Link to={`/restaurant/${order.restaurantId}`}>
                                <Button variant="outline" size="sm">
                                  Voir le restaurant
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {searchQuery ? 'Aucun résultat' : 'Pas encore d\'historique'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? 'Essayez un autre terme de recherche'
                    : 'Vos commandes passées apparaîtront ici'}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Effacer la recherche
                  </Button>
                )}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 pb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/restaurants">
              <Card className="shadow-veat card-hover cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mb-3">
                    <Utensils className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-medium text-sm text-foreground">Restaurants</span>
                </CardContent>
              </Card>
            </Link>

            <Link to="/favorites">
              <Card className="shadow-veat card-hover cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-3">
                    <Heart className="h-6 w-6 text-destructive" />
                  </div>
                  <span className="font-medium text-sm text-foreground">Favoris</span>
                </CardContent>
              </Card>
            </Link>

            <Link to="/profile">
              <Card className="shadow-veat card-hover cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
                    <Settings className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <span className="font-medium text-sm text-foreground">Profil</span>
                </CardContent>
              </Card>
            </Link>

            <Card className="shadow-veat card-hover cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-warning" />
                </div>
                <span className="font-medium text-sm text-foreground">Notifications</span>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
