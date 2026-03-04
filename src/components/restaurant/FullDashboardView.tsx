import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Settings,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Button } from '@/components/ui/forms';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display';
import { Badge } from '@/components/ui/data-display';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/data-display';
import { ScrollArea } from '@/components/ui/layout';
import { useMenuItems } from '@/hooks/useMenuItems';
import type { Order } from '@/types';

interface FullDashboardViewProps {
  orders: Order[];
  restaurantId?: string;
}

export function FullDashboardView({ orders, restaurantId }: FullDashboardViewProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'menu' | 'stats' | 'settings'>('overview');

  const { data: menuItems = [] } = useMenuItems(restaurantId ?? '');

  // Calculate stats
  const todayOrders = orders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.createdAt).toDateString() === today;
  });
  
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const avgOrderValue = completedOrders > 0 ? todayRevenue / completedOrders : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Section Tabs */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as typeof activeSection)}>
            <TabsList className="h-14 w-full justify-start bg-transparent border-b-0">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="menu" className="data-[state=active]:bg-primary/10 gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Menu
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-primary/10 gap-2">
                <TrendingUp className="h-4 w-4" />
                Statistiques
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-primary/10 gap-2">
                <Settings className="h-4 w-4" />
                Paramètres
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="container mx-auto p-4 lg:p-6">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Commandes du jour
                  </CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayOrders.length}</div>
                  <p className="text-xs text-muted-foreground">+12% vs hier</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Chiffre d'affaires
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayRevenue.toFixed(2)} €</div>
                  <p className="text-xs text-muted-foreground">+8% vs hier</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Panier moyen
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgOrderValue.toFixed(2)} €</div>
                  <p className="text-xs text-muted-foreground">+5% vs hier</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Note moyenne
                  </CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.8</div>
                  <p className="text-xs text-muted-foreground">Basé sur 127 avis</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
                <CardDescription>Les dernières actions sur votre restaurant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order, idx) => (
                    <div key={order.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Commande #{order.tableNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.items.length} article{order.items.length > 1 ? 's' : ''} - {order.totalAmount.toFixed(2)} €
                        </p>
                      </div>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Menu Section */}
        {activeSection === 'menu' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Gestion du menu</h2>
                <p className="text-muted-foreground">Gérez vos plats et leurs disponibilités</p>
              </div>
              <Button variant="hero">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un plat
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {menuItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    {item.imageUrl && (
                      <div className="aspect-video bg-muted">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        </div>
                        <Badge variant="outline">{item.category}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-lg font-bold text-primary">{item.price.toFixed(2)} €</span>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            {item.isAvailable ? (
                              <ToggleRight className="h-5 w-5 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Stats Section */}
        {activeSection === 'stats' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Statistiques</h2>
              <p className="text-muted-foreground">Analysez les performances de votre restaurant</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Commandes par jour</CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Graphique des commandes</p>
                    <p className="text-sm">(Bientôt disponible)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plats les plus populaires</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {menuItems.slice(0, 5).map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {idx + 1}
                        </span>
                        <span className="flex-1 font-medium">{item.name}</span>
                        <span className="text-muted-foreground">{Math.floor(Math.random() * 50 + 20)} vendus</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenus par catégorie</CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Graphique des revenus</p>
                    <p className="text-sm">(Bientôt disponible)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Commission V'EAT</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span>Chiffre d'affaires du mois</span>
                      <span className="font-bold">2,450.00 €</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span>Taux de commission</span>
                      <span className="font-bold">5%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                      <span className="font-medium">Commission à payer</span>
                      <span className="font-bold text-primary">122.50 €</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-2xl font-bold">Paramètres</h2>
              <p className="text-muted-foreground">Configurez votre restaurant</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Informations du restaurant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nom</label>
                    <p className="font-medium">Le Petit Bistrot</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                    <p className="font-medium">01 23 45 67 89</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Adresse</label>
                    <p className="font-medium">12 Rue de la Paix, 75001 Paris</p>
                  </div>
                </div>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier les informations
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horaires d'ouverture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => (
                    <div key={day} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="font-medium">{day}</span>
                      <span className="text-muted-foreground">11:30 - 14:30, 18:30 - 22:30</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-4">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier les horaires
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Temps de préparation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Temps moyen de préparation affiché aux clients
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold">20 min</span>
                  <Button variant="outline" size="sm">Modifier</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
