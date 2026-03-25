import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/forms';
import { useAuth } from '@/contexts/AuthContext';
import type { NotificationPreferences } from '@/api/services/auth.service';

const DEFAULT_PREFS: NotificationPreferences = {
  email_orders: true,
  email_promotions: false,
  email_news: false,
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { profile, updateProfile, isAuthenticated, loading } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login');
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (profile?.notification_preferences) {
      setPrefs(profile.notification_preferences);
    }
  }, [profile]);

  const toggle = (key: keyof NotificationPreferences) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ notification_preferences: prefs });
      navigate('/profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) return null;

  const items = [
    { key: 'email_orders' as const, label: 'Confirmations de commandes', description: 'Recevez un email à chaque commande' },
    { key: 'email_promotions' as const, label: 'Promotions', description: 'Offres spéciales et réductions' },
    { key: 'email_news' as const, label: 'Nouveautés V\'EAT', description: 'Nouvelles fonctionnalités et restaurants' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40 px-4 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-lg">Notifications</h1>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-8">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="bg-card rounded-2xl divide-y divide-border overflow-hidden">
            {items.map(item => (
              <div key={item.key} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-card-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(item.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    prefs[item.key] ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      prefs[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </motion.form>
      </div>
    </div>
  );
}
