import { motion } from 'framer-motion';
import { Plus, Minus, AlertTriangle } from 'lucide-react';
import { MenuItem, ALLERGEN_LABELS, Allergen } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MenuItemCardProps {
  item: MenuItem;
  index?: number;
}

export function MenuItemCard({ item, index = 0 }: MenuItemCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const { profile } = useAuth();

  const cartItem = items.find(i => i.menuItem.id === item.id);
  const quantity = cartItem?.quantity || 0;

  // Check if item contains user's allergens
  const userAllergens = profile?.allergies || [];
  const matchingAllergens = item.allergens.filter(a => userAllergens.includes(a));
  const hasUserAllergen = matchingAllergens.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'bg-card rounded-xl p-4 shadow-veat transition-all',
        !item.isAvailable && 'opacity-50',
        hasUserAllergen && 'ring-2 ring-destructive/50'
      )}
    >
      <div className="flex gap-4">
        {/* Image */}
        {item.imageUrl && (
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h4 className="font-semibold text-card-foreground line-clamp-1">
                {item.name}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {item.description}
              </p>
            </div>
            <span className="font-bold text-primary whitespace-nowrap">
              {item.price.toFixed(2)} €
            </span>
          </div>

          {/* Allergens */}
          {item.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.allergens.map(allergen => (
                <span
                  key={allergen}
                  className={cn(
                    'px-2 py-0.5 rounded text-xs',
                    matchingAllergens.includes(allergen)
                      ? 'bg-destructive/10 text-destructive font-medium'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {ALLERGEN_LABELS[allergen as Allergen]}
                </span>
              ))}
            </div>
          )}

          {/* Warning if user has allergen */}
          {hasUserAllergen && (
            <div className="flex items-center gap-1 mt-2 text-destructive text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span>Contient des allergènes auxquels vous êtes sensible</span>
            </div>
          )}

          {/* Add to Cart */}
          <div className="flex items-center justify-end gap-2 mt-3">
            {quantity > 0 ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <Button
                  variant="default"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => addItem(item)}
                  disabled={!item.isAvailable}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => addItem(item)}
                disabled={!item.isAvailable}
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
