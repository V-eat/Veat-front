import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Clock,
  ChefHat, ArrowRight, ArrowLeft, Store, CheckCircle2,
  Upload, FileText, AlertCircle
} from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/forms';
import { Input } from '@/components/ui/forms';
import { Label } from '@/components/ui/forms';
import { Textarea } from '@/components/ui/forms';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/api/client';
import { useAuth } from '@/contexts/useAuthContext';
import { useToast } from '@/hooks/use-toast';

const CUISINE_TYPES = [
  'Français', 'Italien', 'Japonais', 'Chinois', 'Indien', 'Mexicain',
  'Américain', 'Thaïlandais', 'Libanais', 'Marocain', 'Espagnol', 'Autre'
];

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

const step1Schema = z.object({
  firstName: z.string().trim().min(2, 'Le prénom doit contenir au moins 2 caractères').max(50),
  lastName: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(50),
  email: z.string().trim().email('Email invalide').max(255),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

const step2Schema = z.object({
  restaurantName: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  description: z.string().trim().max(500, 'La description ne peut pas dépasser 500 caractères').optional(),
  cuisineType: z.string().optional(),
  phone: z.string().trim().min(10, 'Numéro de téléphone invalide').max(20),
  address: z.string().trim().min(5, 'Adresse trop courte').max(200),
  priceRange: z.number().min(1).max(3),
  preparationTime: z.number().min(5).max(120),
  siret: z.string().trim().regex(/^\d{14}$/, 'Le SIRET doit contenir exactement 14 chiffres'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

interface TimeSlot {
  open: string;
  close: string;
}

interface OpeningHour {
  slots: TimeSlot[];
  isClosed: boolean;
}

export default function RegisterRestaurateurPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user, profile } = useAuth();

  // Si déjà connecté, on commence à l'étape 2 (restaurant info)
  const initialStep = isAuthenticated ? 2 : 1;
  const [step, setStep] = useState(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [step1Data, setStep1Data] = useState<Step1Data>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [step2Data, setStep2Data] = useState<Step2Data>({
    restaurantName: '',
    description: '',
    cuisineType: '',
    phone: '',
    address: '',
    priceRange: 2,
    preparationTime: 20,
    siret: '',
  });

  const [kbisFile, setKbisFile] = useState<File | null>(null);
  const [kbisError, setKbisError] = useState('');

  const [openingHours, setOpeningHours] = useState<Record<string, OpeningHour>>(
    DAYS.reduce((acc, day) => ({
      ...acc,
      [day.key]: { slots: [{ open: '12:00', close: '22:00' }], isClosed: false }
    }), {})
  );

  const addSlot = (day: string) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: { ...prev[day], slots: [...prev[day].slots, { open: '12:00', close: '14:00' }] }
    }));
  };

  const removeSlot = (day: string, idx: number) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: { ...prev[day], slots: prev[day].slots.filter((_, i) => i !== idx) }
    }));
  };

  const updateSlot = (day: string, idx: number, field: keyof TimeSlot, value: string) => {
    setOpeningHours(prev => {
      const slots = prev[day].slots.map((s, i) => i === idx ? { ...s, [field]: value } : s);
      return { ...prev, [day]: { ...prev[day], slots } };
    });
  };

  const validateStep1 = () => {
    const result = step1Schema.safeParse(step1Data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    const result = step2Schema.safeParse(step2Data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(prev - 1, initialStep));
    setErrors({});
  };

  const toggleDayClosed = (day: string, isOpen: boolean) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: { ...prev[day], isClosed: !isOpen }
    }));
  };

  const buildRestaurantPayload = (email: string, kbisUrl: string | null) => ({
    name: step2Data.restaurantName,
    description: step2Data.description || null,
    cuisine_type: step2Data.cuisineType || null,
    email,
    phone: step2Data.phone,
    address: step2Data.address,
    price_range: step2Data.priceRange,
    preparation_time: step2Data.preparationTime,
    opening_hours: JSON.parse(JSON.stringify(openingHours)),
    siret: step2Data.siret,
    kbis_document_url: kbisUrl,
  });

  const uploadKbis = async (userId: string): Promise<string | null> => {
    if (!kbisFile) return null;
    const path = `${userId}/${Date.now()}.pdf`;
    const { data, error } = await supabase.storage.from('kbis').upload(path, kbisFile, {
      contentType: 'application/pdf',
      upsert: false,
    });
    if (error) throw new Error(`Erreur upload Kbis : ${error.message}`);
    const { data: { publicUrl } } = supabase.storage.from('kbis').getPublicUrl(data.path);
    return publicUrl;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      if (isAuthenticated) {
        const kbisUrl = await uploadKbis(user!.id);
        await api.put('/profile', { role: 'restaurateur' });
        await api.post('/restaurants', buildRestaurantPayload(user?.email ?? '', kbisUrl));

        toast({
          title: 'Dossier soumis !',
          description: 'Votre restaurant est en attente de validation par notre équipe (sous 48h).',
        });
        
        // Wait a bit for auth context to refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        navigate('/dashboard');
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: step1Data.email,
          password: step1Data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              first_name: step1Data.firstName,
              last_name: step1Data.lastName,
              role: 'restaurateur',
            },
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Erreur lors de la création du compte');

        const kbisUrl = await uploadKbis(authData.user.id);

        if (authData.session) {
          // Initialize profile and role
          try {
            await api.post('/profile/init-on-signup', {
              first_name: step1Data.firstName,
              last_name: step1Data.lastName,
              role: 'restaurateur',
            });
          } catch (err) {
            console.error('Failed to initialize profile:', err);
          }

          await api.post('/restaurants', buildRestaurantPayload(step1Data.email, kbisUrl));
        }

        toast({
          title: 'Dossier soumis !',
          description: 'Votre restaurant est en attente de validation par notre équipe (sous 48h).',
        });
        
        // Wait a bit for auth context to refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        navigate('/dashboard');
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Pour la barre de progression : 2 étapes si connecté, 3 sinon
  const totalSteps = isAuthenticated ? 2 : 3;
  const displayStep = isAuthenticated ? step - 1 : step;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - Image */}
      <div className="hidden lg:block lg:w-2/5 relative">
        <div className="absolute inset-0 gradient-hero" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center text-white">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
              <ChefHat className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Devenir partenaire V'EAT</h2>
            <p className="text-lg text-white/80 max-w-md">
              Rejoignez notre réseau de restaurateurs et développez votre activité grâce à la commande anticipée.
            </p>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">V</span>
            </div>
            <span className="text-xl font-bold text-foreground">V'EAT</span>
          </Link>

          {/* Bannière utilisateur connecté */}
          {isAuthenticated && profile && (
            <div className="flex items-center gap-3 p-3 mb-6 rounded-xl bg-primary/10 border border-primary/20">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-sm text-foreground">
                Connecté en tant que <span className="font-semibold">{profile.first_name} {profile.last_name}</span>
                {' '}— votre compte sera converti en compte restaurateur.
              </p>
            </div>
          )}

          {/* Barre de progression */}
          <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s <= displayStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {s}
                </div>
                {s < totalSteps && (
                  <div className={`flex-1 h-1 rounded transition-colors ${
                    s < displayStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Personal Info (uniquement si non connecté) */}
          {step === 1 && !isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-2xl font-bold text-foreground mb-2">Vos informations</h1>
              <p className="text-muted-foreground mb-6">
                Déjà inscrit ?{' '}
                <Link to="/login?redirect=/partner" className="text-primary font-medium hover:underline">
                  Connectez-vous
                </Link>
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="firstName"
                        placeholder="Jean"
                        value={step1Data.firstName}
                        onChange={(e) => setStep1Data(prev => ({ ...prev, firstName: e.target.value }))}
                        className={`pl-10 h-12 ${errors.firstName ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      placeholder="Dupont"
                      value={step1Data.lastName}
                      onChange={(e) => setStep1Data(prev => ({ ...prev, lastName: e.target.value }))}
                      className={`h-12 ${errors.lastName ? 'border-destructive' : ''}`}
                    />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email professionnel</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@restaurant.fr"
                      value={step1Data.email}
                      onChange={(e) => setStep1Data(prev => ({ ...prev, email: e.target.value }))}
                      className={`pl-10 h-12 ${errors.email ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={step1Data.password}
                      onChange={(e) => setStep1Data(prev => ({ ...prev, password: e.target.value }))}
                      className={`pl-10 pr-10 h-12 ${errors.password ? 'border-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={step1Data.confirmPassword}
                      onChange={(e) => setStep1Data(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`pl-10 h-12 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>

                <Button variant="hero" size="lg" className="w-full mt-6" onClick={handleNextStep}>
                  Continuer
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Restaurant Info */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-2xl font-bold text-foreground mb-2">Votre restaurant</h1>
              <p className="text-muted-foreground mb-6">
                Renseignez les informations de votre établissement
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">Nom du restaurant</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="restaurantName"
                      placeholder="Le Petit Bistrot"
                      value={step2Data.restaurantName}
                      onChange={(e) => setStep2Data(prev => ({ ...prev, restaurantName: e.target.value }))}
                      className={`pl-10 h-12 ${errors.restaurantName ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.restaurantName && <p className="text-xs text-destructive">{errors.restaurantName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre restaurant, votre cuisine, votre ambiance..."
                    value={step2Data.description}
                    onChange={(e) => setStep2Data(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {step2Data.description?.length || 0}/500
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type de cuisine</Label>
                    <Select
                      value={step2Data.cuisineType}
                      onValueChange={(value) => setStep2Data(prev => ({ ...prev, cuisineType: value }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {CUISINE_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Gamme de prix</Label>
                    <Select
                      value={step2Data.priceRange.toString()}
                      onValueChange={(value) => setStep2Data(prev => ({ ...prev, priceRange: parseInt(value) }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">€ - Économique</SelectItem>
                        <SelectItem value="2">€€ - Modéré</SelectItem>
                        <SelectItem value="3">€€€ - Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="01 23 45 67 89"
                      value={step2Data.phone}
                      onChange={(e) => setStep2Data(prev => ({ ...prev, phone: e.target.value }))}
                      className={`pl-10 h-12 ${errors.phone ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse complète</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="address"
                      placeholder="12 Rue de la Paix, 75002 Paris"
                      value={step2Data.address}
                      onChange={(e) => setStep2Data(prev => ({ ...prev, address: e.target.value }))}
                      className={`pl-10 h-12 ${errors.address ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preparationTime">Temps de préparation moyen (minutes)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="preparationTime"
                      type="number"
                      min={5}
                      max={120}
                      value={step2Data.preparationTime}
                      onChange={(e) => setStep2Data(prev => ({ ...prev, preparationTime: parseInt(e.target.value) || 20 }))}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                {/* Séparateur vérification légale */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">Vérification légale</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siret">Numéro SIRET <span className="text-destructive">*</span></Label>
                  <Input
                    id="siret"
                    placeholder="12345678901234"
                    maxLength={14}
                    value={step2Data.siret}
                    onChange={(e) => setStep2Data(prev => ({ ...prev, siret: e.target.value.replace(/\D/g, '') }))}
                    className={`h-12 font-mono tracking-wider ${errors.siret ? 'border-destructive' : ''}`}
                  />
                  {errors.siret && <p className="text-xs text-destructive">{errors.siret}</p>}
                  <p className="text-xs text-muted-foreground">
                    Trouvez votre SIRET sur{' '}
                    <a href="https://www.infogreffe.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      infogreffe.fr
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kbis">
                    Extrait Kbis (PDF) <span className="text-muted-foreground font-normal">— optionnel mais recommandé</span>
                  </Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                      kbisFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {kbisFile ? (
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{kbisFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(kbisFile.size / 1024 / 1024).toFixed(2)} Mo
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setKbisFile(null)}
                          className="text-muted-foreground"
                        >
                          Supprimer
                        </Button>
                      </div>
                    ) : (
                      <label htmlFor="kbis" className="flex flex-col items-center gap-2 cursor-pointer py-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Cliquez pour déposer votre Kbis (PDF, max 5 Mo)
                        </span>
                        <input
                          id="kbis"
                          type="file"
                          accept="application/pdf"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              setKbisError('Le fichier dépasse 5 Mo');
                              return;
                            }
                            setKbisError('');
                            setKbisFile(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {kbisError && <p className="text-xs text-destructive">{kbisError}</p>}
                </div>

                {/* Bandeau validation */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">
                    Votre restaurant sera <strong>en attente de validation</strong> après soumission.
                    Notre équipe vérifie votre dossier sous <strong>48h ouvrées</strong> avant de le rendre visible sur la plateforme.
                  </p>
                </div>

                <div className="flex gap-4 mt-6">
                  {!isAuthenticated && (
                    <Button variant="outline" size="lg" onClick={handlePrevStep}>
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Retour
                    </Button>
                  )}
                  <Button variant="hero" size="lg" className="flex-1" onClick={handleNextStep}>
                    Continuer
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Opening Hours */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-2xl font-bold text-foreground mb-2">Horaires d'ouverture</h1>
              <p className="text-muted-foreground mb-6">
                Définissez vos horaires pour chaque jour de la semaine
              </p>

              <div className="space-y-3">
                {DAYS.map(day => (
                  <div key={day.key} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm w-24">{day.label}</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!openingHours[day.key].isClosed}
                          onChange={(e) => toggleDayClosed(day.key, e.target.checked)}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-muted-foreground">
                          {openingHours[day.key].isClosed ? 'Fermé' : 'Ouvert'}
                        </span>
                      </label>
                    </div>

                    {!openingHours[day.key].isClosed && (
                      <div className="space-y-2 pl-2">
                        {openingHours[day.key].slots.map((slot, idx) => (
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
                            {openingHours[day.key].slots.length > 1 && (
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
                        {openingHours[day.key].slots.length < 3 && (
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

              <div className="flex gap-4 mt-8">
                <Button variant="outline" size="lg" onClick={handlePrevStep}>
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Retour
                </Button>
                <Button
                  variant="hero"
                  size="lg"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Création en cours...' : 'Créer mon restaurant'}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-6">
                En créant votre restaurant, vous acceptez nos{' '}
                <Link to="/terms" className="text-primary hover:underline">
                  conditions d'utilisation
                </Link>{' '}
                et notre{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  politique de confidentialité
                </Link>
                .
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
