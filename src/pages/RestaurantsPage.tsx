import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/forms';
import { Button } from '@/components/ui/forms';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { useRestaurantsWithFavorites } from '@/hooks/useRestaurants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms';

const cuisineTypes = ['Tous', 'Français', 'Japonais', 'Italien', 'Américain', 'Thaïlandais', 'Végétarien'];
const priceRanges = [
  { value: 'all', label: 'Tous les prix' },
  { value: '1', label: '€ - Économique' },
  { value: '2', label: '€€ - Modéré' },
  { value: '3', label: '€€€ - Premium' },
];

export default function RestaurantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('Tous');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  const { data: restaurants = [], isLoading } = useRestaurantsWithFavorites({
    search: searchQuery || undefined,
    cuisineType: selectedCuisine !== 'Tous' ? selectedCuisine : undefined,
    priceRange: selectedPrice !== 'all' ? parseInt(selectedPrice) : undefined,
  });

  const filteredRestaurants = useMemo(() => {
    return [...restaurants].sort((a, b) => {
      switch (sortBy) {
        case 'rating': return b.rating - a.rating;
        case 'distance': return (a.distance || 999) - (b.distance || 999);
        case 'price-low': return a.priceRange - b.priceRange;
        case 'price-high': return b.priceRange - a.priceRange;
        default: return 0;
      }
    });
  }, [restaurants, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCuisine('Tous');
    setSelectedPrice('all');
  };

  const hasActiveFilters =
    searchQuery || selectedCuisine !== 'Tous' || selectedPrice !== 'all';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container mx-auto px-4 py-4">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedPrice} onValueChange={setSelectedPrice}>
                <SelectTrigger className="w-[160px] h-12">
                  <SelectValue placeholder="Prix" />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px] h-12">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Mieux notés</SelectItem>
                  <SelectItem value="distance">Plus proches</SelectItem>
                  <SelectItem value="price-low">Prix croissant</SelectItem>
                  <SelectItem value="price-high">Prix décroissant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cuisine Filters */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {cuisineTypes.map(cuisine => (
              <Button
                key={cuisine}
                variant={selectedCuisine === cuisine ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCuisine(cuisine)}
                className="whitespace-nowrap"
              >
                {cuisine}
              </Button>
            ))}
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Filtres actifs:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-primary hover:text-primary"
              >
                <X className="h-4 w-4 mr-1" />
                Effacer tout
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {isLoading ? 'Chargement...' : `${filteredRestaurants.length} restaurant${filteredRestaurants.length !== 1 ? 's' : ''} trouvé${filteredRestaurants.length !== 1 ? 's' : ''}`}
          </h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant, index) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Aucun restaurant trouvé
            </h3>
            <p className="text-muted-foreground mb-4">
              Essayez de modifier vos critères de recherche
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Effacer les filtres
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
