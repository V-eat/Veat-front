import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Heart } from 'lucide-react';
import { Input } from '@/components/ui/forms';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { mockRestaurants } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/forms';

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock favorites - in real app would come from user data
  const favoriteRestaurants = mockRestaurants.filter((_, i) => i % 2 === 0);

  const filteredFavorites = favoriteRestaurants.filter(
    r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisineType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Connectez-vous pour voir vos favoris
          </h2>
          <p className="text-muted-foreground mb-6">
            Sauvegardez vos restaurants préférés et retrouvez-les facilement.
          </p>
          <Link to="/login">
            <Button variant="hero" size="lg">
              Se connecter
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">Mes favoris</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans mes favoris..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {filteredFavorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((restaurant, index) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={{ ...restaurant, isFavorite: true }}
                index={index}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery ? 'Aucun résultat' : 'Pas encore de favoris'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Essayez un autre terme de recherche'
                : 'Explorez les restaurants et ajoutez-les à vos favoris'}
            </p>
            <Link to="/restaurants">
              <Button variant="outline">Explorer les restaurants</Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
