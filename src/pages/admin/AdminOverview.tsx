import { motion } from 'framer-motion';
import { Users, Store, ShoppingBag, Euro, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminStats } from '@/hooks/useAdmin';

export default function AdminOverview() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-muted rounded-t-lg" />
            <CardContent className="h-16" />
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Utilisateurs',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Restaurants',
      value: stats?.totalRestaurants || 0,
      icon: Store,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Commandes',
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Revenus totaux',
      value: `${(stats?.totalRevenue || 0).toFixed(2)} €`,
      icon: Euro,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Frais "Pressé"',
      value: `${(stats?.rushedFees || 0).toFixed(2)} €`,
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      subtitle: 'Dont 60% reversés aux restaurateurs',
    },
    {
      title: 'Revenus plateforme',
      value: `${(stats?.platformFees || 0).toFixed(2)} €`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      subtitle: 'Frais de service + 40% option pressé',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de la plateforme V'EAT</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
