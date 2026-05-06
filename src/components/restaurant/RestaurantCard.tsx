import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, MapPin, Heart } from 'lucide-react';
import { Restaurant } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/useAuthContext';
import { useToggleFavorite } from '@/hooks/useFavorites';

interface RestaurantCardProps {
  restaurant: Restaurant;
  index?: number;
}

export function RestaurantCard({ restaurant, index = 0 }: RestaurantCardProps) {
  const priceSymbols = '€'.repeat(restaurant.priceRange);
  const { user } = useAuth();
  const toggleFavorite = useToggleFavorite();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    toggleFavorite.mutate({
      userId: user.id,
      restaurantId: restaurant.id,
      isFavorite: restaurant.isFavorite ?? false,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Link to={`/restaurant/${restaurant.id}`}>
        <div className="group bg-card rounded-2xl overflow-hidden shadow-veat card-hover">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            {restaurant.imageUrl ? (
              <img
                src={restaurant.imageUrl}
                alt={restaurant.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-sm text-muted-foreground">
                Aucune photo
              </div>
            )}
            <div className="absolute inset-0 gradient-overlay opacity-50" />

            {/* Favorite Button */}
            <button
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110"
              onClick={handleFavoriteClick}
              disabled={toggleFavorite.isPending}
            >
              <Heart
                className={cn(
                  'h-5 w-5 transition-colors',
                  restaurant.isFavorite
                    ? 'fill-primary text-primary'
                    : 'text-muted-foreground'
                )}
              />
            </button>

            {/* Cuisine Type Badge */}
            {restaurant.cuisineType && (
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-foreground">
                  {restaurant.cuisineType}
                </span>
              </div>
            )}

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-3 text-white text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-semibold">{restaurant.rating}</span>
                  <span className="text-white/70">({restaurant.reviewCount})</span>
                </div>
                <span className="text-white/50">•</span>
                <span className="text-white/90">{priceSymbols}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-bold text-lg text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
              {restaurant.name}
            </h3>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
              {restaurant.description}
            </p>

            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{restaurant.preparationTime} min</span>
              </div>
              {restaurant.distance && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{restaurant.distance} km</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
