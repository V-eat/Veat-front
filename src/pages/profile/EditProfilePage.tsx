import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, User } from 'lucide-react';
import { Button } from '@/components/ui/forms';
import { Input } from '@/components/ui/forms';
import { useAuth } from '@/contexts/useAuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { profile, updateProfile, isAuthenticated, loading } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login');
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setDateOfBirth(profile.date_of_birth || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${profile!.user_id}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth || null,
        avatar_url: avatarUrl || null,
      });
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
        <h1 className="font-semibold text-lg">Modifier mon profil</h1>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-8">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer">
                <Camera className="h-4 w-4 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            {uploading && <p className="text-sm text-muted-foreground">Téléchargement...</p>}
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Prénom</label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom</label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de naissance</label>
              <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={saving || uploading}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </motion.form>
      </div>
    </div>
  );
}
