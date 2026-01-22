import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, CreditCard, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateOrder } from '@/hooks/useOrders';
import { mockRestaurants } from '@/data/mockData';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, restaurantId, totalAmount, arrivalTime, isRushed, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const createOrder = useCreateOrder();
  
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const restaurant = mockRestaurants.find(r => r.id === restaurantId);
  const serviceFee = 1.5;
  const rushedFee = 2.5;
  const finalTotal = totalAmount + serviceFee + (isRushed ? rushedFee : 0);

  // Redirect if cart is empty or not authenticated
  if (!isAuthenticated) {
    navigate('/login?redirect=/checkout');
    return null;
  }

  if (items.length === 0 && !orderSuccess) {
    navigate('/cart');
    return null;
  }

  const handleSubmitOrder = async () => {
    if (!user || !restaurantId || !arrivalTime) return;

    setIsSubmitting(true);
    try {
      const orderItems = items.map(item => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
      }));

      await createOrder.mutateAsync({
        user_id: user.id,
        restaurant_id: restaurantId,
        items: orderItems,
        total_amount: finalTotal,
        arrival_time: arrivalTime,
        table_number: tableNumber ? parseInt(tableNumber) : null,
        is_rushed: isRushed,
        special_instructions: specialInstructions || null,
        status: 'pending',
      });

      setOrderSuccess(true);
      clearCart();
      toast.success('Commande envoyée avec succès !');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erreur lors de la création de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl p-8 shadow-veat text-center max-w-md w-full"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-card-foreground mb-2">
            Commande confirmée !
          </h1>
          <p className="text-muted-foreground mb-6">
            Votre commande a été envoyée au restaurant. Elle sera prête pour votre arrivée à {arrivalTime}.
          </p>
          <div className="space-y-3">
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={() => navigate('/my-orders')}
            >
              Voir mes commandes
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => navigate('/restaurants')}
            >
              Continuer à explorer
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/cart')}>
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Finaliser la commande</h1>
              {restaurant && (
                <p className="text-sm text-muted-foreground">{restaurant.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Arrival Time Confirmation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-6 shadow-veat"
            >
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg text-card-foreground">
                  Heure d'arrivée
                </h2>
              </div>
              <p className="text-2xl font-bold text-primary">{arrivalTime}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Votre commande sera prête à cette heure
              </p>
              {isRushed && (
                <div className="mt-3 inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  ⚡ Service prioritaire
                </div>
              )}
            </motion.div>

            {/* Table Number */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl p-6 shadow-veat"
            >
              <h2 className="font-semibold text-lg text-card-foreground mb-4">
                Numéro de table (optionnel)
              </h2>
              <Input
                type="number"
                placeholder="Ex: 12"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Si vous connaissez votre numéro de table, indiquez-le ici
              </p>
            </motion.div>

            {/* Special Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl p-6 shadow-veat"
            >
              <h2 className="font-semibold text-lg text-card-foreground mb-4">
                Instructions spéciales
              </h2>
              <Textarea
                placeholder="Allergies, préférences, demandes spéciales..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
              />
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl p-6 shadow-veat sticky top-36"
            >
              <h3 className="font-bold text-lg text-card-foreground mb-4">
                Récapitulatif
              </h3>

              {/* Items */}
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.menuItem.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.menuItem.name}
                    </span>
                    <span className="text-card-foreground">
                      {(item.menuItem.price * item.quantity).toFixed(2)} €
                    </span>
                  </div>
                ))}
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
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Confirmer la commande
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-3">
                Paiement sur place au restaurant
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
