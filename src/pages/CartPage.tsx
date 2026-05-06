import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, Clock, AlertCircle, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/forms';
import { Switch } from '@/components/ui/forms';
import { Label } from '@/components/ui/forms';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/useAuthContext';
import { useRestaurant } from '@/hooks/useRestaurants';
import { cn } from '@/lib/utils';
import { GroupTableWidget } from '@/components/table/GroupTableWidget';
import { getTable, updateTableArrivalTime } from '@/api/services/table.service';

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    restaurantId,
    updateQuantity,
    removeItem,
    clearCart,
    totalAmount,
    arrivalTime,
    setArrivalTime,
    isRushed,
    setIsRushed,
    tableId,
    tableHostUserId,
    setTableHostUserId,
  } = useCart();
  const { isAuthenticated, user } = useAuth();

  const { data: restaurant } = useRestaurant(restaurantId ?? '');
  const serviceFee = 1.5;
  const rushedFee = 2.5; // 1.5€ pour le restaurateur, 1€ pour la plateforme
  const finalTotal = totalAmount + serviceFee + (isRushed ? rushedFee : 0);
  const isTableGuest = !!tableId && !!tableHostUserId && user?.id !== tableHostUserId;
  const isTableHost = !!tableId && !!tableHostUserId && user?.id === tableHostUserId;

  const normalizeTime = (time: string | null | undefined) => {
    if (!time) return null;
    // DB TIME values may come back as HH:MM:SS while the select uses HH:MM.
    return time.slice(0, 5);
  };

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    for (let hour = currentHour; hour < 23; hour++) {
      for (let min = 0; min < 60; min += 30) {
        if (hour === currentHour && min <= currentMinutes + 30) continue;
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    if (!tableId) return;

    let active = true;

    const loadTableState = async () => {
      try {
        const table = await getTable(tableId);
        if (!active) return;

        setTableHostUserId(table.host_user_id || null);
        const normalizedArrival = normalizeTime(table.arrival_time);
        if (normalizedArrival) {
          setArrivalTime(normalizedArrival);
        }
      } catch {
        // Keep UX resilient if table sync fails temporarily.
      }
    };

    void loadTableState();
    const interval = window.setInterval(() => {
      void loadTableState();
    }, 7000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [tableId, setArrivalTime, setTableHostUserId]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-4"
        >
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Votre panier est vide</h2>
          <p className="text-muted-foreground mb-6">
            Ajoutez des plats depuis un restaurant pour commencer
          </p>
          <Link to="/restaurants">
            <Button variant="hero" size="lg">
              Explorer les restaurants
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }
    if (!arrivalTime) {
      alert("Veuillez sélectionner une heure d'arrivée");
      return;
    }
    navigate('/checkout');
  };

  const handleArrivalChange = async (value: string) => {
    const normalized = normalizeTime(value) || value;
    setArrivalTime(normalized);

    if (tableId && isTableHost) {
      try {
        await updateTableArrivalTime(tableId, normalized);
      } catch {
        // Keep the selected value locally and notify host.
        alert("Impossible de synchroniser l'heure de table pour le moment.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)}>
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Mon panier</h1>
              {restaurant && (
                <p className="text-sm text-muted-foreground">{restaurant.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.menuItem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-4 shadow-veat flex gap-4"
              >
                {item.menuItem.imageUrl && (
                  <img
                    src={item.menuItem.imageUrl}
                    alt={item.menuItem.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-card-foreground line-clamp-1">
                      {item.menuItem.name}
                    </h3>
                    <button
                      onClick={() => removeItem(item.menuItem.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {item.menuItem.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="default"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="font-bold text-primary">
                      {(item.menuItem.price * item.quantity).toFixed(2)} €
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={clearCart}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Vider le panier
            </Button>

            {restaurantId && (
              <div className="mt-4">
                <p className="text-sm font-medium text-card-foreground mb-2">Commander en groupe</p>
                <GroupTableWidget restaurantId={restaurantId} />
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 shadow-veat sticky top-36">
              <h3 className="font-bold text-lg text-card-foreground mb-6">Récapitulatif</h3>

              {/* Arrival Time */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Heure d'arrivée
                </label>
                <select
                  value={normalizeTime(arrivalTime) || ''}
                  onChange={(e) => void handleArrivalChange(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm"
                  disabled={isTableGuest}
                >
                  <option value="">Choisir une heure</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                {isTableGuest && (
                  <p className="text-xs text-muted-foreground mt-2">
                    L'heure d'arrivee est fixee par le createur de la table.
                  </p>
                )}
                {restaurant && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Temps de préparation: ~{restaurant.preparationTime} min
                  </p>
                )}
              </div>

              {/* Rushed Option */}
              <div className={cn(
                "flex items-center justify-between mb-6 p-3 rounded-lg border-2 transition-all cursor-pointer",
                isRushed 
                  ? "bg-primary/10 border-primary" 
                  : "bg-accent/50 border-transparent hover:border-primary/30"
              )}
              onClick={() => setIsRushed(!isRushed)}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className={cn("h-5 w-5", isRushed ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <Label htmlFor="rushed" className="font-medium cursor-pointer">
                      Je suis pressé(e)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Service prioritaire • +{rushedFee.toFixed(2)} €
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-semibold",
                    isRushed ? "text-primary" : "text-muted-foreground"
                  )}>
                    +{rushedFee.toFixed(2)} €
                  </span>
                  <Switch
                    id="rushed"
                    checked={isRushed}
                    onCheckedChange={setIsRushed}
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t border-border pt-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="text-card-foreground">{totalAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frais de service</span>
                  <span className="text-card-foreground">{serviceFee.toFixed(2)} €</span>
                </div>
                {isRushed && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Option pressé</span>
                    <span className="text-primary font-medium">+{rushedFee.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-3 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{finalTotal.toFixed(2)} €</span>
                </div>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={handleCheckout}
                disabled={!arrivalTime}
              >
                {isAuthenticated ? 'Valider la commande' : 'Se connecter pour commander'}
              </Button>

              {!arrivalTime && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Sélectionnez une heure d'arrivée pour continuer
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
