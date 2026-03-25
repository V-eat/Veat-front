import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/forms';
import { useAuth } from '@/contexts/AuthContext';
import { ALLERGEN_LABELS, Allergen } from '@/types';

const ALLERGENS = Object.keys(ALLERGEN_LABELS) as Allergen[];

export default function AllergiesPage() {
  const navigate = useNavigate();
  const { profile, updateProfile, isAuthenticated, loading } = useAuth();
  const [selected, setSelected] = useState<Set<Allergen>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login');
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (profile?.allergies) {
      setSelected(new Set(profile.allergies as Allergen[]));
    }
  }, [profile]);

  const toggle = (allergen: Allergen) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(allergen)) next.delete(allergen);
      else next.add(allergen);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ allergies: Array.from(selected) });
      navigate('/profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40 px-4 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-lg">Mes allergies</h1>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-8">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <p className="text-sm text-muted-foreground">
            Sélectionnez vos allergènes. Ces informations seront affichées lors de vos commandes.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {ALLERGENS.map(allergen => (
              <button
                key={allergen}
                type="button"
                onClick={() => toggle(allergen)}
                className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors border ${
                  selected.has(allergen)
                    ? 'bg-destructive/10 border-destructive text-destructive'
                    : 'bg-card border-border text-card-foreground hover:border-muted-foreground'
                }`}
              >
                {ALLERGEN_LABELS[allergen]}
              </button>
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
