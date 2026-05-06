import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/forms';
import { Input } from '@/components/ui/forms';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms';
import { useAuth } from '@/contexts/useAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ProfileSettings } from '@/api/services/auth.service';

const DEFAULT_SETTINGS: ProfileSettings = {
  language: 'fr',
  theme: 'system',
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, updateProfile, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = useState<ProfileSettings>(DEFAULT_SETTINGS);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login');
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (profile?.settings) {
      setSettings(profile.settings);
    }
  }, [profile]);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ settings });
      navigate('/profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas.', variant: 'destructive' });
      return;
    }
    setChangingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Mot de passe modifié', description: 'Votre mot de passe a été mis à jour.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Une erreur est survenue', variant: 'destructive' });
    } finally {
      setChangingPwd(false);
    }
  };

  if (loading || !profile) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40 px-4 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-lg">Paramètres</h1>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* Language & Theme */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSettingsSubmit}
          className="space-y-4"
        >
          <h2 className="font-semibold text-foreground">Préférences</h2>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Langue</label>
              <Select
                value={settings.language}
                onValueChange={(v) => setSettings(prev => ({ ...prev, language: v as ProfileSettings['language'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Thème</label>
              <Select
                value={settings.theme}
                onValueChange={(v) => setSettings(prev => ({ ...prev, theme: v as ProfileSettings['theme'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Clair</SelectItem>
                  <SelectItem value="dark">Sombre</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </motion.form>

        {/* Password Change */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handlePasswordChange}
          className="space-y-4"
        >
          <h2 className="font-semibold text-foreground">Changer le mot de passe</h2>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nouveau mot de passe</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmer le mot de passe</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
                minLength={6}
                required
              />
            </div>
          </div>
          <Button type="submit" variant="outline" className="w-full" disabled={changingPwd}>
            {changingPwd ? 'Modification...' : 'Changer le mot de passe'}
          </Button>
        </motion.form>
      </div>
    </div>
  );
}
