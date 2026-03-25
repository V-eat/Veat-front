import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, CreditCard, Clock, CheckCircle, Loader2, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/forms';
import { Input } from '@/components/ui/forms';
import { Label } from '@/components/ui/forms';
import { Textarea } from '@/components/ui/forms';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateOrder } from '@/hooks/useOrders';
import { useRestaurant } from '@/hooks/useRestaurants';
import { createPaymentIntent } from '@/api/services/stripe.service';
import { toast } from 'sonner';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Inner form component (needs to be inside Elements provider)
function PaymentForm({
  clientSecret,
  finalTotal,
  onSuccess,
  isSubmitting,
  setIsSubmitting,
}: {
  clientSecret: string;
  finalTotal: number;
  onSuccess: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setIsSubmitting(true);
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        toast.error(result.error.message || 'Erreur de paiement');
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess();
      }
    } catch {
      toast.error('Erreur lors du paiement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border border-border rounded-lg bg-muted/30">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': { color: '#aab7c4' },
              },
            },
          }}
        />
      </div>
      <Button
        variant="hero"
        size="lg"
        className="w-full"
        onClick={handlePay}
        disabled={isSubmitting || !stripe}
      >
        {isSubmitting ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Paiement en cours...</>
        ) : (
          <><Lock className="h-4 w-4 mr-2" />Payer {finalTotal.toFixed(2)} €</>
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
        <Lock className="h-3 w-3" /> Paiement sécurisé par Stripe
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, restaurantId, totalAmount, arrivalTime, isRushed, clearCart, tableId } = useCart();
  const { user, isAuthenticated } = useAuth();
  const createOrder = useCreateOrder();

  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const { data: restaurant } = useRestaurant(restaurantId ?? '');
  const serviceFee = 1.5;
  const rushedFee = 2.5;
  const finalTotal = totalAmount + serviceFee + (isRushed ? rushedFee : 0);

  if (!isAuthenticated) {
    navigate('/login?redirect=/checkout');
    return null;
  }
  if (items.length === 0 && !orderSuccess) {
    navigate('/cart');
    return null;
  }

  const handleProceedToPayment = async () => {
    if (!restaurantId || !arrivalTime) return;
    setIsSubmitting(true);
    try {
      const { clientSecret: cs } = await createPaymentIntent(finalTotal, restaurantId);
      setClientSecret(cs);
      setStep('payment');
    } catch {
      toast.error("Impossible d'initialiser le paiement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!user || !restaurantId || !arrivalTime) return;
    try {
      const orderItems = items.map(item => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
      }));

      await createOrder.mutateAsync({
        restaurant_id: restaurantId,
        items: orderItems,
        total_amount: finalTotal,
        arrival_time: arrivalTime,
        table_number: tableNumber ? parseInt(tableNumber) : null,
        is_rushed: isRushed,
        special_instructions: specialInstructions || null,
        table_id: tableId ?? null,
      });

      setOrderSuccess(true);
      clearCart();
      toast.success('Commande envoyée avec succès !');
    } catch {
      toast.error('Paiement réussi mais erreur lors de la commande. Contactez le support.');
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
          <h1 className="text-2xl font-bold text-card-foreground mb-2">Commande confirmée !</h1>
          <p className="text-muted-foreground mb-6">
            Votre paiement a été accepté. Votre commande sera prête à {arrivalTime}.
          </p>
          <div className="space-y-3">
            <Button variant="hero" size="lg" className="w-full" onClick={() => navigate('/my-orders')}>
              Voir mes commandes
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/restaurants')}>
              Continuer à explorer
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => step === 'payment' ? setStep('details') : navigate('/cart')}>
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {step === 'details' ? 'Finaliser la commande' : 'Paiement'}
              </h1>
              {restaurant && <p className="text-sm text-muted-foreground">{restaurant.name}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {step === 'details' ? (
              <>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-6 shadow-veat">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold text-lg">Heure d'arrivée</h2>
                  </div>
                  <p className="text-2xl font-bold text-primary">{arrivalTime}</p>
                  {isRushed && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      ⚡ Service prioritaire
                    </div>
                  )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-6 shadow-veat">
                  <h2 className="font-semibold text-lg mb-4">Numéro de table (optionnel)</h2>
                  <Input type="number" placeholder="Ex: 12" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} className="max-w-xs" />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl p-6 shadow-veat">
                  <h2 className="font-semibold text-lg mb-4">Instructions spéciales</h2>
                  <Textarea placeholder="Allergies, préférences..." value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} rows={3} />
                </motion.div>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-6 shadow-veat">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-lg">Informations de paiement</h2>
                </div>
                {clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm
                      clientSecret={clientSecret}
                      finalTotal={finalTotal}
                      onSuccess={handlePaymentSuccess}
                      isSubmitting={isSubmitting}
                      setIsSubmitting={setIsSubmitting}
                    />
                  </Elements>
                )}
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl p-6 shadow-veat sticky top-36">
              <h3 className="font-bold text-lg mb-4">Récapitulatif</h3>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.menuItem.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.quantity}x {item.menuItem.name}</span>
                    <span>{(item.menuItem.price * item.quantity).toFixed(2)} €</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3 border-t border-border pt-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{totalAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frais de service</span>
                  <span>{serviceFee.toFixed(2)} €</span>
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

              {step === 'details' && (
                <Button variant="hero" size="lg" className="w-full" onClick={handleProceedToPayment} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Chargement...</> : <><CreditCard className="h-4 w-4 mr-2" />Procéder au paiement</>}
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
