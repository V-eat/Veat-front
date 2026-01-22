import { motion } from 'framer-motion';
import { TrendingUp, Euro, Zap, Store, ShoppingBag, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAdminStats, useAdminOrders } from '@/hooks/useAdmin';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useMemo } from 'react';
import { format, subDays, startOfDay, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdminAnalytics() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: orders, isLoading: ordersLoading } = useAdminOrders();

  // Calculate orders per day for last 7 days
  const ordersPerDay = useMemo(() => {
    if (!orders) return [];
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'dd/MM', { locale: fr }),
        fullDate: startOfDay(date),
        orders: 0,
        revenue: 0,
      };
    });

    orders.forEach(order => {
      const orderDate = startOfDay(new Date(order.created_at));
      const dayData = last7Days.find(d => d.fullDate.getTime() === orderDate.getTime());
      if (dayData) {
        dayData.orders += 1;
        dayData.revenue += Number(order.total_amount);
      }
    });

    return last7Days.map(({ date, orders, revenue }) => ({
      date,
      commandes: orders,
      revenus: revenue,
    }));
  }, [orders]);

  // Calculate order status distribution
  const statusDistribution = useMemo(() => {
    if (!orders) return [];
    
    const counts: Record<string, number> = {};
    orders.forEach(order => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });

    const statusLabels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      preparing: 'En préparation',
      ready: 'Prêt',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };

    return Object.entries(counts).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
    }));
  }, [orders]);

  // Calculate rushed vs normal orders
  const rushedDistribution = useMemo(() => {
    if (!orders) return [];
    
    const rushed = orders.filter(o => o.is_rushed).length;
    const normal = orders.length - rushed;

    return [
      { name: 'Normal', value: normal },
      { name: 'Pressé', value: rushed },
    ];
  }, [orders]);

  // Calculate revenue breakdown
  const revenueBreakdown = useMemo(() => {
    if (!stats) return [];

    const restaurateurShare = (stats.rushedFees / 2.5) * 1.5; // 1.5€ per rushed order goes to restaurateur
    const platformFromRushed = (stats.rushedFees / 2.5) * 1; // 1€ per rushed order for platform
    const serviceFees = (stats.totalOrders - (stats.rushedFees / 2.5)) * 1.5 + (stats.rushedFees / 2.5) * 1.5;

    return [
      { name: 'Frais de service', value: serviceFees },
      { name: 'Comm. pressé (plateforme)', value: platformFromRushed },
      { name: 'Comm. pressé (restaurateurs)', value: restaurateurShare },
    ];
  }, [stats]);

  if (statsLoading || ordersLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-16 bg-muted rounded-t-lg" />
            <CardContent className="h-64" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics & Finances</h1>
        <p className="text-muted-foreground">Analyse détaillée des performances de la plateforme</p>
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chiffre d'affaires total
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.totalRevenue || 0).toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">
              Sur toutes les commandes complétées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenus plateforme
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{(stats?.platformFees || 0).toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">
              Frais de service + commission pressé
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenus option "Pressé"
            </CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{(stats?.rushedFees || 0).toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">
              60% reversés aux restaurateurs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Orders per day */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes (7 derniers jours)</CardTitle>
            <CardDescription>Évolution du nombre de commandes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersPerDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="commandes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des statuts</CardTitle>
            <CardDescription>Distribution des commandes par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rushed vs Normal */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes pressées</CardTitle>
            <CardDescription>Proportion de commandes avec l'option pressé</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rushedDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell fill="hsl(var(--muted-foreground))" />
                    <Cell fill="hsl(45, 93%, 47%)" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des revenus</CardTitle>
            <CardDescription>Sources de revenus de la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={150} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(2)} €`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
