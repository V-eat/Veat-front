import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Settings,
  Heart,
  ShoppingBag,
  LogOut,
  Bell,
  ChevronRight,
  AlertTriangle,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/forms';
import { useAuth } from '@/contexts/useAuthContext';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, signOut, isAuthenticated, loading, isRestaurateur } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // This should not happen due to the redirect above, but just in case
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Vous devez être connecté pour accéder à cette page.</p>
          <Link to="/login">
            <Button>Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    // Profile is still loading or failed to load
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      icon: ShoppingBag,
      label: 'Mes commandes',
      description: 'Historique et commandes en cours',
      to: '/my-orders',
    },
    {
      icon: Heart,
      label: 'Mes favoris',
      description: 'Restaurants enregistrés',
      to: '/favorites',
    },
    {
      icon: AlertTriangle,
      label: 'Mes allergies',
      description: profile.allergies?.length
        ? `${profile.allergies.length} allergène(s) configuré(s)`
        : 'Aucune allergie configurée',
      to: '/allergies',
    },
    {
      icon: Bell,
      label: 'Notifications',
      description: 'Gérer les notifications',
      to: '/notifications',
    },
    {
      icon: Settings,
      label: 'Paramètres',
      description: 'Compte et préférences',
      to: '/settings',
    },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-hero pt-20 pb-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.first_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {profile.first_name?.[0] || 'U'}{profile.last_name?.[0] || ''}
                </span>
              )}
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">
                {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-white/80">{profile.email}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="container mx-auto px-4 -mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-veat-lg overflow-hidden"
        >
          {/* Quick Actions */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-card-foreground">Mon profil</h2>
              <Link to="/profile/edit">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </Link>
            </div>
          </div>

          {/* Menu Items */}
          <div className="divide-y divide-border">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={item.to}
                  className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-card-foreground">{item.label}</h3>
                    <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Logout */}
          <div className="p-6 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Se déconnecter
            </Button>
          </div>
        </motion.div>

        {/* Restaurant Owner CTA */}
        {!isRestaurateur && <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-card rounded-2xl p-6 shadow-veat border border-primary/20"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-white">R</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-card-foreground mb-1">
                Vous êtes restaurateur ?
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Inscrivez votre restaurant sur V'EAT et touchez de nouveaux clients.
              </p>
              <Link to="/partner">
                <Button variant="hero" size="sm">
                  Devenir partenaire
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>}
      </div>
    </div>
  );
}
