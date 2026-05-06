import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Input } from '@/components/ui/forms';
import { Textarea } from '@/components/ui/forms';
import { Label } from '@/components/ui/forms';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display';
import { Badge } from '@/components/ui/data-display';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/data-display';
import { ScrollArea } from '@/components/ui/layout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/overlays';
import { useMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from '@/hooks/useMenuItems';
import { useUpdateRestaurant } from '@/hooks/useRestaurants';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createStripeConnectOnboardingLink, getStripeConnectStatus } from '@/api/services/stripe.service';
import { ALLERGEN_LABELS, type Allergen, type Order, type OpeningHours, type TimeSlot, type Restaurant, type MenuItem } from '@/types';

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

interface DayHourEdit {
  slots: TimeSlot[];
  isClosed: boolean;
}

interface FullDashboardViewProps {
  orders: Order[];
  restaurantId?: string;
  restaurant?: Restaurant;
  openingHours?: OpeningHours;
}

const DISH_ALLERGENS: Allergen[] = [
  'eggs',
  'milk',
  'mustard',
  'peanuts',
  'crustaceans',
  'fish',
  'sesame',
  'soybeans',
  'sulphites',
  'nuts',
  'gluten',
];

export function FullDashboardView({ orders, restaurantId, restaurant, openingHours: initialOpeningHours }: FullDashboardViewProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'menu' | 'stats' | 'settings'>('overview');
  const [hoursDialogOpen, setHoursDialogOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingMenuImage, setIsUploadingMenuImage] = useState(false);
  const [isLoadingStripeStatus, setIsLoadingStripeStatus] = useState(false);
  const [isRedirectingStripe, setIsRedirectingStripe] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<{
    hasAccount: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    onboardingComplete: boolean;
  } | null>(null);
  const [editHours, setEditHours] = useState<Record<string, DayHourEdit>>({});
  const [editInfo, setEditInfo] = useState({
    name: '',
    description: '',
    imageUrl: '',
    cuisineType: '',
    email: '',
    phone: '',
    address: '',
    priceRange: 1 as 1 | 2 | 3,
    preparationTime: 20,
  });
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const menuItemImageInputRef = useRef<HTMLInputElement | null>(null);
  const updateRestaurant = useUpdateRestaurant();
  const { toast } = useToast();

  const { data: menuItems = [] } = useMenuItems(restaurantId ?? '');
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();

  // Menu item dialog state
  const [menuItemDialogOpen, setMenuItemDialogOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuItemForm, setMenuItemForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    allergens: [] as Allergen[],
    imageUrl: '',
    isAvailable: true,
  });

  const openCreateMenuItemDialog = () => {
    setEditingMenuItem(null);
    setMenuItemForm({ name: '', description: '', price: 0, category: '', allergens: [], imageUrl: '', isAvailable: true });
    if (menuItemImageInputRef.current) menuItemImageInputRef.current.value = '';
    setMenuItemDialogOpen(true);
  };

  const openEditMenuItemDialog = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuItemForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      allergens: Array.isArray(item.allergens) ? item.allergens : [],
      imageUrl: item.imageUrl ?? '',
      isAvailable: item.isAvailable,
    });
    if (menuItemImageInputRef.current) menuItemImageInputRef.current.value = '';
    setMenuItemDialogOpen(true);
  };

  const handleMenuItemImageUpload = async (file: File) => {
    if (!restaurantId) {
      toast({
        title: 'Restaurant introuvable',
        description: 'Impossible de televerser une image sans identifiant restaurant.',
        variant: 'destructive',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Format non supporte',
        description: 'Selectionnez un fichier image (jpg, png, webp, etc.).',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Image trop lourde',
        description: 'La taille maximale autorisee est de 5 Mo.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingMenuImage(true);

    try {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${restaurantId}/menu-items/${Date.now()}-${safeFileName}`;
      const bucket = import.meta.env.VITE_SUPABASE_MENU_IMAGES_BUCKET
        || import.meta.env.VITE_SUPABASE_RESTAURANT_IMAGES_BUCKET
        || 'restaurant-images';

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      if (!data?.publicUrl) {
        throw new Error('Impossible de recuperer l URL publique de l image.');
      }

      setMenuItemForm((prev) => ({ ...prev, imageUrl: data.publicUrl }));
      toast({
        title: 'Image televersee',
        description: 'La photo du plat a ete envoyee avec succes.',
      });
    } catch (error: unknown) {
      toast({
        title: 'Echec du televersement',
        description: error instanceof Error ? error.message : 'Verifiez le bucket Supabase et vos permissions Storage.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingMenuImage(false);
      if (menuItemImageInputRef.current) menuItemImageInputRef.current.value = '';
    }
  };

  const saveMenuItem = async () => {
    if (!restaurantId) return;
    const allergensArray = menuItemForm.allergens;

    if (editingMenuItem) {
      await updateMenuItem.mutateAsync({
        id: editingMenuItem.id,
        name: menuItemForm.name,
        description: menuItemForm.description,
        price: menuItemForm.price,
        category: menuItemForm.category,
        allergens: allergensArray,
        imageUrl: menuItemForm.imageUrl || undefined,
        isAvailable: menuItemForm.isAvailable,
      });
    } else {
      await createMenuItem.mutateAsync({
        restaurantId,
        name: menuItemForm.name,
        description: menuItemForm.description,
        price: menuItemForm.price,
        category: menuItemForm.category,
        allergens: allergensArray,
        imageUrl: menuItemForm.imageUrl || undefined,
        isAvailable: menuItemForm.isAvailable,
      });
    }
    setMenuItemDialogOpen(false);
  };

  const handleDeleteMenuItem = (id: string) => {
    if (!restaurantId) return;
    deleteMenuItem.mutate({ id, restaurantId });
  };

  const handleToggleAvailability = (item: MenuItem) => {
    updateMenuItem.mutate({ id: item.id, isAvailable: !item.isAvailable });
  };

  const openHoursDialog = () => {
    const initial = DAYS.reduce((acc, day) => {
      const existing = initialOpeningHours?.[day.key as keyof OpeningHours];
      if (existing) {
        acc[day.key] = { slots: existing.slots ?? [{ open: '12:00', close: '22:00' }], isClosed: existing.isClosed };
      } else {
        acc[day.key] = { slots: [{ open: '12:00', close: '22:00' }], isClosed: false };
      }
      return acc;
    }, {} as Record<string, DayHourEdit>);
    setEditHours(initial);
    setHoursDialogOpen(true);
  };

  const openInfoDialog = () => {
    setEditInfo({
      name: restaurant?.name ?? '',
      description: restaurant?.description ?? '',
      imageUrl: restaurant?.imageUrl ?? '',
      cuisineType: restaurant?.cuisineType ?? '',
      email: restaurant?.email ?? '',
      phone: restaurant?.phone ?? '',
      address: restaurant?.address ?? '',
      priceRange: restaurant?.priceRange ?? 1,
      preparationTime: restaurant?.preparationTime ?? 20,
    });
    setInfoDialogOpen(true);
  };

  const addSlot = (day: string) => {
    setEditHours(prev => ({
      ...prev,
      [day]: { ...prev[day], slots: [...prev[day].slots, { open: '12:00', close: '14:00' }] }
    }));
  };

  const removeSlot = (day: string, idx: number) => {
    setEditHours(prev => ({
      ...prev,
      [day]: { ...prev[day], slots: prev[day].slots.filter((_, i) => i !== idx) }
    }));
  };

  const updateSlot = (day: string, idx: number, field: keyof TimeSlot, value: string) => {
    setEditHours(prev => {
      const slots = prev[day].slots.map((s, i) => i === idx ? { ...s, [field]: value } : s);
      return { ...prev, [day]: { ...prev[day], slots } };
    });
  };

  const toggleDayClosed = (day: string, isOpen: boolean) => {
    setEditHours(prev => ({ ...prev, [day]: { ...prev[day], isClosed: !isOpen } }));
  };

  const saveHours = async () => {
    if (!restaurantId) return;
    await updateRestaurant.mutateAsync({ id: restaurantId, opening_hours: editHours });
    setHoursDialogOpen(false);
  };

  const handleImageUpload = async (file: File) => {
    if (!restaurantId) {
      toast({
        title: 'Restaurant introuvable',
        description: 'Impossible de televerser une image sans identifiant restaurant.',
        variant: 'destructive',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Format non supporte',
        description: 'Selectionnez un fichier image (jpg, png, webp, etc.).',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Image trop lourde',
        description: 'La taille maximale autorisee est de 5 Mo.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${restaurantId}/${Date.now()}-${safeFileName || `image.${ext}`}`;
      const bucket = import.meta.env.VITE_SUPABASE_RESTAURANT_IMAGES_BUCKET || 'restaurant-images';

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      if (!data?.publicUrl) {
        throw new Error('Impossible de recuperer l URL publique de l image.');
      }

      setEditInfo((prev) => ({ ...prev, imageUrl: data.publicUrl }));

      // Persist image URL to DB immediately so the list updates right away
      await updateRestaurant.mutateAsync({ id: restaurantId, image_url: data.publicUrl });

      toast({
        title: 'Image televersee',
        description: 'La photo du restaurant a ete envoyee avec succes.',
      });
    } catch (error: unknown) {
      toast({
        title: 'Echec du televersement',
        description: error instanceof Error ? error.message : 'Verifiez le bucket Supabase et vos permissions Storage.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const saveInfo = async () => {
    if (!restaurantId) return;

    await updateRestaurant.mutateAsync({
      id: restaurantId,
      name: editInfo.name.trim(),
      description: editInfo.description.trim(),
      image_url: editInfo.imageUrl.trim(),
      cuisine_type: editInfo.cuisineType.trim() || null,
      email: editInfo.email.trim(),
      phone: editInfo.phone.trim(),
      address: editInfo.address.trim(),
      price_range: editInfo.priceRange,
      preparation_time: editInfo.preparationTime,
    });

    setInfoDialogOpen(false);
  };

  useEffect(() => {
    const loadStripeStatus = async () => {
      if (!restaurantId) return;
      setIsLoadingStripeStatus(true);
      try {
        const status = await getStripeConnectStatus(restaurantId);
        setStripeStatus(status);
      } catch {
        setStripeStatus(null);
      } finally {
        setIsLoadingStripeStatus(false);
      }
    };

    if (activeSection === 'settings') {
      void loadStripeStatus();
    }
  }, [activeSection, restaurantId]);

  const startStripeOnboarding = async () => {
    if (!restaurantId) return;
    setIsRedirectingStripe(true);
    try {
      const currentUrl = window.location.href;
      const { url } = await createStripeConnectOnboardingLink(restaurantId, currentUrl, currentUrl);
      window.location.assign(url);
    } catch (error: unknown) {
      toast({
        title: 'Stripe Connect indisponible',
        description: error instanceof Error ? error.message : 'Impossible de demarrer l onboarding Stripe.',
        variant: 'destructive',
      });
      setIsRedirectingStripe(false);
    }
  };

  // Dashboard metrics sourced from backend orders/menu data.
  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    const todayKey = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayKey = yesterday.toDateString();

    const isCompleted = (status: string) => status === 'completed';
    const isCancelled = (status: string) => status === 'cancelled';

    const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === todayKey);
    const yesterdayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === yesterdayKey);

    const todayCompleted = todayOrders.filter((o) => isCompleted(o.status));
    const yesterdayCompleted = yesterdayOrders.filter((o) => isCompleted(o.status));

    const todayRevenue = todayCompleted.reduce((sum, o) => sum + o.totalAmount, 0);
    const yesterdayRevenue = yesterdayCompleted.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = todayCompleted.length > 0 ? todayRevenue / todayCompleted.length : 0;

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthCompletedOrders = orders.filter(
      (o) => isCompleted(o.status) && new Date(o.createdAt) >= monthStart
    );
    const monthlyRevenue = monthCompletedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const monthlyFees = monthCompletedOrders.reduce(
      (sum, o) => sum + 1.5 + (o.isRushed ? 1 : 0),
      0
    );
    const monthlyCommissionRate = monthlyRevenue > 0 ? (monthlyFees / monthlyRevenue) * 100 : 0;

    const soldCountByItem = new Map<string, { name: string; quantity: number }>();
    orders
      .filter((o) => !isCancelled(o.status))
      .forEach((order) => {
        order.items.forEach((item) => {
          const key = item.menuItem.id || item.menuItem.name;
          const existing = soldCountByItem.get(key);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            soldCountByItem.set(key, { name: item.menuItem.name, quantity: item.quantity });
          }
        });
      });

    const topSellingItems = Array.from(soldCountByItem.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const orderDelta = yesterdayOrders.length > 0
      ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100
      : null;
    const revenueDelta = yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : null;

    return {
      todayOrdersCount: todayOrders.length,
      todayRevenue,
      avgOrderValue,
      todayCompletedCount: todayCompleted.length,
      monthlyRevenue,
      monthlyFees,
      monthlyCommissionRate,
      topSellingItems,
      orderDelta,
      revenueDelta,
      rating: restaurant?.rating ?? 0,
      reviewCount: restaurant?.reviewCount ?? 0,
    };
  }, [orders, restaurant?.rating, restaurant?.reviewCount]);

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
                  <div className="text-2xl font-bold">{dashboardMetrics.todayOrdersCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardMetrics.orderDelta === null
                      ? 'Pas de reference hier'
                      : `${dashboardMetrics.orderDelta >= 0 ? '+' : ''}${dashboardMetrics.orderDelta.toFixed(1)}% vs hier`}
                  </p>
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
                  <div className="text-2xl font-bold">{dashboardMetrics.todayRevenue.toFixed(2)} €</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardMetrics.revenueDelta === null
                      ? 'Pas de reference hier'
                      : `${dashboardMetrics.revenueDelta >= 0 ? '+' : ''}${dashboardMetrics.revenueDelta.toFixed(1)}% vs hier`}
                  </p>
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
                  <div className="text-2xl font-bold">{dashboardMetrics.avgOrderValue.toFixed(2)} €</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardMetrics.todayCompletedCount} commandes completees aujourd'hui
                  </p>
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
                  <div className="text-2xl font-bold">{dashboardMetrics.rating.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    Base sur {dashboardMetrics.reviewCount} avis
                  </p>
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
              <Button variant="hero" onClick={openCreateMenuItemDialog}>
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
                          <Button variant="ghost" size="icon" onClick={() => openEditMenuItemDialog(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleToggleAvailability(item)}>
                            {item.isAvailable ? (
                              <ToggleRight className="h-5 w-5 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteMenuItem(item.id)}>
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
                    {dashboardMetrics.topSellingItems.length === 0 && (
                      <p className="text-sm text-muted-foreground">Pas encore de ventes enregistrees.</p>
                    )}
                    {dashboardMetrics.topSellingItems.map((item, idx) => (
                      <div key={`${item.name}-${idx}`} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {idx + 1}
                        </span>
                        <span className="flex-1 font-medium">{item.name}</span>
                        <span className="text-muted-foreground">{item.quantity} vendu{item.quantity > 1 ? 's' : ''}</span>
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
                      <span className="font-bold">{dashboardMetrics.monthlyRevenue.toFixed(2)} €</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span>Taux de commission</span>
                      <span className="font-bold">{dashboardMetrics.monthlyCommissionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                      <span className="font-medium">Commission à payer</span>
                      <span className="font-bold text-primary">{dashboardMetrics.monthlyFees.toFixed(2)} €</span>
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
                    <p className="font-medium">{restaurant?.name ?? '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                    <p className="font-medium">{restaurant?.phone ?? '-'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Adresse</label>
                    <p className="font-medium">{restaurant?.address ?? '-'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="font-medium">{restaurant?.description ?? '-'}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={openInfoDialog} disabled={!restaurantId}>
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
                  {DAYS.map(({ key, label }) => {
                    const day = initialOpeningHours?.[key as keyof OpeningHours];
                    return (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="font-medium">{label}</span>
                        {day?.isClosed ? (
                          <span className="text-muted-foreground italic">Fermé</span>
                        ) : (
                          <span className="text-muted-foreground">
                            {day?.slots?.map(s => `${s.open}–${s.close}`).join(', ') ?? '–'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Button variant="outline" className="mt-4" onClick={openHoursDialog}>
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
                  <span className="text-2xl font-bold">{restaurant?.preparationTime ?? 20} min</span>
                  <Button variant="outline" size="sm" onClick={openInfoDialog} disabled={!restaurantId}>
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paiements Stripe Connect</CardTitle>
                <CardDescription>
                  Activez vos paiements pour recevoir automatiquement les versements clients.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingStripeStatus ? (
                  <p className="text-sm text-muted-foreground">Chargement du statut Stripe...</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Compte connecte</span>
                      <Badge variant={stripeStatus?.hasAccount ? 'default' : 'secondary'}>
                        {stripeStatus?.hasAccount ? 'Oui' : 'Non'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Paiements actives</span>
                      <Badge variant={stripeStatus?.chargesEnabled ? 'default' : 'secondary'}>
                        {stripeStatus?.chargesEnabled ? 'Oui' : 'Non'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Virements actives</span>
                      <Badge variant={stripeStatus?.payoutsEnabled ? 'default' : 'secondary'}>
                        {stripeStatus?.payoutsEnabled ? 'Oui' : 'Non'}
                      </Badge>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={startStripeOnboarding}
                  disabled={!restaurantId || isRedirectingStripe}
                >
                  {isRedirectingStripe ? 'Redirection...' : 'Configurer Stripe Connect'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Opening Hours Dialog */}
      <Dialog open={hoursDialogOpen} onOpenChange={setHoursDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier les horaires</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {DAYS.map(day => (
              <div key={day.key} className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm w-24">{day.label}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!(editHours[day.key]?.isClosed ?? false)}
                      onChange={(e) => toggleDayClosed(day.key, e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-muted-foreground">
                      {editHours[day.key]?.isClosed ? 'Fermé' : 'Ouvert'}
                    </span>
                  </label>
                </div>

                {!editHours[day.key]?.isClosed && (
                  <div className="space-y-2 pl-2">
                    {(editHours[day.key]?.slots ?? []).map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={slot.open}
                          onChange={(e) => updateSlot(day.key, idx, 'open', e.target.value)}
                          className="h-9 w-28"
                        />
                        <span className="text-muted-foreground">–</span>
                        <Input
                          type="time"
                          value={slot.close}
                          onChange={(e) => updateSlot(day.key, idx, 'close', e.target.value)}
                          className="h-9 w-28"
                        />
                        {(editHours[day.key]?.slots?.length ?? 0) > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive px-2"
                            onClick={() => removeSlot(day.key, idx)}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    ))}
                    {(editHours[day.key]?.slots?.length ?? 0) < 3 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-primary text-xs h-7 px-2"
                        onClick={() => addSlot(day.key)}
                      >
                        + Ajouter un créneau
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHoursDialogOpen(false)}>Annuler</Button>
            <Button onClick={saveHours} disabled={updateRestaurant.isPending}>
              {updateRestaurant.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Menu Item Create/Edit Dialog */}
      <Dialog open={menuItemDialogOpen} onOpenChange={setMenuItemDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMenuItem ? 'Modifier le plat' : 'Ajouter un plat'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label htmlFor="mi-name">Nom *</Label>
              <Input
                id="mi-name"
                value={menuItemForm.name}
                onChange={(e) => setMenuItemForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom du plat"
              />
            </div>
            <div>
              <Label htmlFor="mi-description">Description</Label>
              <Textarea
                id="mi-description"
                value={menuItemForm.description}
                onChange={(e) => setMenuItemForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du plat"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="mi-price">Prix (€) *</Label>
              <Input
                id="mi-price"
                type="number"
                min={0}
                step={0.01}
                value={menuItemForm.price}
                onChange={(e) => setMenuItemForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="mi-category">Catégorie *</Label>
              <Select
                value={menuItemForm.category}
                onValueChange={(value) => setMenuItemForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="mi-category">
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entrée">Entrée</SelectItem>
                  <SelectItem value="Plat principal">Plat principal</SelectItem>
                  <SelectItem value="Dessert">Dessert</SelectItem>
                  <SelectItem value="Boisson">Boisson</SelectItem>
                  <SelectItem value="Snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Allergènes</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {DISH_ALLERGENS.map((allergen) => {
                  const selected = menuItemForm.allergens.includes(allergen);
                  const label = ALLERGEN_LABELS[allergen];
                  return (
                    <Button
                      key={allergen}
                      type="button"
                      variant={selected ? 'default' : 'outline'}
                      size="sm"
                      aria-pressed={selected}
                      className="rounded-full"
                      onClick={() => {
                        setMenuItemForm((prev) => {
                          const next = prev.allergens.includes(allergen)
                            ? prev.allergens.filter((a) => a !== allergen)
                            : [...prev.allergens, allergen];
                          return { ...prev, allergens: next };
                        });
                      }}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label htmlFor="mi-image">URL de l'image</Label>
              {menuItemForm.imageUrl && (
                <div className="mb-2 overflow-hidden rounded-md border border-border">
                  <img
                    src={menuItemForm.imageUrl}
                    alt="Photo du plat"
                    className="h-32 w-full object-cover"
                  />
                </div>
              )}
              <Input
                id="mi-image"
                value={menuItemForm.imageUrl}
                onChange={(e) => setMenuItemForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Input
                  ref={menuItemImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleMenuItemImageUpload(file);
                    }
                  }}
                  className="max-w-sm"
                />
                <span className="text-xs text-muted-foreground">
                  {isUploadingMenuImage ? 'Televersement en cours...' : 'Max 5 Mo'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={menuItemForm.isAvailable}
                  onChange={(e) => setMenuItemForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                  className="rounded border-border"
                />
                <span className="text-sm font-medium">Disponible</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMenuItemDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={saveMenuItem}
              disabled={
                createMenuItem.isPending
                || updateMenuItem.isPending
                || isUploadingMenuImage
                || !menuItemForm.name
                || !menuItemForm.category
              }
            >
              {(createMenuItem.isPending || updateMenuItem.isPending) ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restaurant Info Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier les informations du restaurant</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="restaurant-name">Nom</Label>
              <Input
                id="restaurant-name"
                value={editInfo.name}
                onChange={(e) => setEditInfo((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nom du restaurant"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="restaurant-description">Description</Label>
              <Textarea
                id="restaurant-description"
                value={editInfo.description}
                onChange={(e) => setEditInfo((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre restaurant"
                rows={4}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="restaurant-image">URL de la photo</Label>
              {editInfo.imageUrl && (
                <div className="mb-2 overflow-hidden rounded-md border border-border">
                  <img
                    src={editInfo.imageUrl}
                    alt="Photo du restaurant"
                    className="h-40 w-full object-cover"
                  />
                </div>
              )}
              <Input
                id="restaurant-image"
                value={editInfo.imageUrl}
                onChange={(e) => setEditInfo((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleImageUpload(file);
                    }
                  }}
                  className="max-w-sm"
                />
                <span className="text-xs text-muted-foreground">
                  {isUploadingImage ? 'Televersement en cours...' : 'Max 5 Mo'}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="restaurant-cuisine">Type de cuisine</Label>
              <Input
                id="restaurant-cuisine"
                value={editInfo.cuisineType}
                onChange={(e) => setEditInfo((prev) => ({ ...prev, cuisineType: e.target.value }))}
                placeholder="Française, Italienne..."
              />
            </div>

            <div>
              <Label htmlFor="restaurant-price-range">Gamme de prix</Label>
              <Select
                value={String(editInfo.priceRange)}
                onValueChange={(value) => {
                  const parsed = Number(value);
                  const clamped = Math.min(3, Math.max(1, Number.isNaN(parsed) ? 1 : parsed));
                  setEditInfo((prev) => ({ ...prev, priceRange: clamped as 1 | 2 | 3 }));
                }}
              >
                <SelectTrigger id="restaurant-price-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">€ - Économique</SelectItem>
                  <SelectItem value="2">€€ - Modéré</SelectItem>
                  <SelectItem value="3">€€€ - Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="restaurant-email">Email</Label>
              <Input
                id="restaurant-email"
                type="email"
                value={editInfo.email}
                onChange={(e) => setEditInfo((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="contact@restaurant.fr"
              />
            </div>

            <div>
              <Label htmlFor="restaurant-phone">Telephone</Label>
              <Input
                id="restaurant-phone"
                value={editInfo.phone}
                onChange={(e) => setEditInfo((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="01 23 45 67 89"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="restaurant-address">Adresse</Label>
              <Input
                id="restaurant-address"
                value={editInfo.address}
                onChange={(e) => setEditInfo((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Adresse complete"
              />
            </div>

            <div>
              <Label htmlFor="restaurant-preparation-time">Temps de preparation (minutes)</Label>
              <Input
                id="restaurant-preparation-time"
                type="number"
                min={1}
                max={180}
                value={editInfo.preparationTime}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  const clamped = Math.min(180, Math.max(1, Number.isNaN(value) ? 20 : value));
                  setEditInfo((prev) => ({ ...prev, preparationTime: clamped }));
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveInfo} disabled={updateRestaurant.isPending || !restaurantId}>
              {updateRestaurant.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
