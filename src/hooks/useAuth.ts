import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string | null;
  avatar_url: string | null;
  allergies: string[];
  preferences: string[];
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  role: 'client' | 'restaurateur' | 'admin';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<'client' | 'restaurateur' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile;
  }, []);

  const fetchRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching role:', error);
      return null;
    }
    return data?.role as 'client' | 'restaurateur' | 'admin';
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadUserData = async (userId: string) => {
      try {
        const [profileData, roleData] = await Promise.all([
          fetchProfile(userId),
          fetchRole(userId)
        ]);
        if (isMounted) {
          setProfile(profileData);
          setRole(roleData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state changed:', event, session?.user?.id);
        
        // Update user and session immediately
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Load user data in background, don't block
          loadUserData(session.user.id);
        } else {
          setProfile(null);
          setRole(null);
        }
        
        // Always set loading to false after auth state change
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        console.log('Initial session:', session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserData(session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchRole]);

  const signUp = async (
    email: string,
    password: string,
    metadata: {
      first_name: string;
      last_name: string;
      role?: 'client' | 'restaurateur';
    }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: metadata.first_name,
          last_name: metadata.last_name,
          role: metadata.role || 'client',
        },
      },
    });

    if (error) {
      toast({
        title: 'Erreur d\'inscription',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    toast({
      title: 'Compte créé !',
      description: 'Bienvenue sur V\'EAT !',
    });

    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    toast({
      title: 'Connexion réussie',
      description: 'Content de vous revoir !',
    });

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Erreur de déconnexion',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);

    toast({
      title: 'Déconnexion',
      description: 'À bientôt !',
    });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    toast({
      title: 'Email envoyé',
      description: 'Vérifiez votre boîte mail pour réinitialiser votre mot de passe.',
    });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    setProfile(data as Profile);

    toast({
      title: 'Profil mis à jour',
      description: 'Vos informations ont été enregistrées.',
    });

    return data;
  };

  return {
    user,
    session,
    profile,
    role,
    loading,
    isLoading: loading,
    isAuthenticated: !!user,
    isRestaurateur: role === 'restaurateur',
    isClient: role === 'client',
    isAdmin: role === 'admin',
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  };
}
