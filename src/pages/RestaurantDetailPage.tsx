import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star,
  Clock,
  MapPin,
  Phone,
  Mail,
  Heart,
  Share2,
  ChevronLeft,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/forms';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/data-display';
import { MenuItemCard } from '@/components/restaurant/MenuItemCard';
import { mockRestaurants, mockMenuItems, mockReviews } from '@/data/mockData';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const restaurant = mockRestaurants.find(r => r.id === id);
  const menuItems = mockMenuItems[id || ''] || [];
  const reviews = mockReviews[id || ''] || [];
  const { totalItems, totalAmount, restaurantId } = useCart();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFavorite, setIsFavorite] = useState(restaurant?.isFavorite || false);

  const categories = useMemo(() => {
    const cats = ['all', ...new Set(menuItems.map(item => item.category))];
    return cats;
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === 'all') return menuItems;
    return menuItems.filter(item => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Restaurant non trouvé</h1>
          <Link to="/restaurants">
            <Button>Retour aux restaurants</Button>
          </Link>
        </div>
      </div>
    );
  }

  const priceSymbols = '€'.repeat(restaurant.priceRange);
  const isCurrentCart = restaurantId === restaurant.id;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Image */}
      <div className="relative h-64 md:h-96">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 gradient-overlay" />

        {/* Back Button */}
        <Link
          to="/restaurants"
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center"
          >
            <Heart
              className={cn(
                'h-5 w-5',
                isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground'
              )}
            />
          </button>
          <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-veat-lg p-6"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {restaurant.cuisineType && (
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {restaurant.cuisineType}
                  </span>
                )}
                <span className="text-muted-foreground">{priceSymbols}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-card-foreground mb-2">
                {restaurant.name}
              </h1>
              <p className="text-muted-foreground mb-4">{restaurant.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-warning text-warning" />
                  <span className="font-semibold">{restaurant.rating}</span>
                  <span className="text-muted-foreground">({restaurant.reviewCount} avis)</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>~{restaurant.preparationTime} min</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{restaurant.address}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:text-right">
              <a
                href={`tel:${restaurant.phone}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4" />
                {restaurant.phone}
              </a>
              <a
                href={`mailto:${restaurant.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                {restaurant.email}
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Menu & Reviews Tabs */}
      <div className="container mx-auto px-4 mt-8">
        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="menu" className="flex-1 md:flex-none">
              Menu
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 md:flex-none">
              Avis ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="info" className="flex-1 md:flex-none">
              Infos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="mt-6">
            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="whitespace-nowrap capitalize"
                >
                  {cat === 'all' ? 'Tout' : cat}
                </Button>
              ))}
            </div>

            {/* Menu Items */}
            <div className="space-y-4">
              {filteredMenuItems.map((item, index) => (
                <MenuItemCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-xl p-4 shadow-veat"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-card-foreground">{review.userName}</h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-4 w-4',
                            i < review.rating
                              ? 'fill-warning text-warning'
                              : 'text-muted-foreground/30'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">{review.comment}</p>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="info" className="mt-6">
            <div className="bg-card rounded-xl p-6 shadow-veat space-y-6">
              <div>
                <h3 className="font-semibold text-card-foreground mb-3">Horaires d'ouverture</h3>
                <div className="space-y-2">
                  {Object.entries(restaurant.openingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="capitalize text-muted-foreground">{day}</span>
                      <span className="text-card-foreground">
                        {hours?.isClosed ? 'Fermé' : `${hours?.open} - ${hours?.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-card-foreground mb-3">Adresse</h3>
                <p className="text-muted-foreground text-sm">{restaurant.address}</p>
              </div>

              <div>
                <h3 className="font-semibold text-card-foreground mb-3">Contact</h3>
                <div className="space-y-2">
                  <a
                    href={`tel:${restaurant.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {restaurant.phone}
                  </a>
                  <a
                    href={`mailto:${restaurant.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {restaurant.email}
                  </a>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Cart Button */}
      {totalItems > 0 && isCurrentCart && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-4 right-4 z-50"
        >
          <Link to="/cart">
            <Button variant="hero" size="xl" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">
                  {totalItems}
                </span>
                Voir le panier
              </span>
              <span className="font-bold">{totalAmount.toFixed(2)} €</span>
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
