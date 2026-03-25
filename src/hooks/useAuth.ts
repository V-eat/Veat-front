/**
 * Hook d'authentification
 * 
 * Fournit l'état d'authentification et les méthodes pour gérer la session utilisateur.
 * Utilise React Query pour la gestion du cache et les services API pour les opérations.
 */

import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as authService from '@/api/services/auth.service';

export type { Profile } from '@/api/services/auth.service';
export type { UserRole } from '@/api/services/auth.service';

/**
 * Petite utilitaire pour éviter les attentes infinies si Supabase ne répond pas.
 */
const withTimeout = async <T,>(promise: Promise<T>, ms = 5000, fallback?: () => T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve, reject) => {
      const id = setTimeout(() => {
        if (fallback) {
          try {
            resolve(fallback());
            return;
          } catch (err) {
            reject(err);
            return;
          }
        }
        reject(new Error('timeout'));
      }, ms);
      promise.finally(() => clearTimeout(id));
    }),
  ]);
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<authService.Profile | null>(null);
  const [role, setRole] = useState<'client' | 'restaurateur' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  /**
   * Charge les données utilisateur (profil et rôle)
   */
  const loadUserData = useCallback(async (authUser: User) => {
    try {
      const [profileData, roleData] = await Promise.all([
        withTimeout(authService.getProfile(authUser.id), 5000, () => null),
        withTimeout(authService.getUserRole(authUser.id), 5000, () => null),
      ]);

      const metadataRole = authUser.user_metadata?.role;
      const metadataRoleSafe =
        metadataRole === 'client' || metadataRole === 'restaurateur' || metadataRole === 'admin'
          ? metadataRole
          : null;

      setProfile(profileData);
      setRole(roleData ?? metadataRoleSafe);
    } catch (error) {
      console.error('Error loading user data:', error);

      // Ensure profile is set to null on error
      setProfile(null);

      const metadataRole = authUser.user_metadata?.role;
      const metadataRoleSafe =
        metadataRole === 'client' || metadataRole === 'restaurateur' || metadataRole === 'admin'
          ? metadataRole
          : null;
      setRole(metadataRoleSafe);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let hasInitialized = false;

    // Écoute les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setProfile(null);
          setRole(null);
        }
        
        // Only set loading to false after initialization is complete
        if (hasInitialized && isMounted) {
          setLoading(false);
        }
      }
    );

    // Initialise la session au chargement
    const initSession = async () => {
      try {
        const session = await withTimeout(authService.getSession(), 5000, () => null);
        if (!isMounted) return;
        
        console.log('Initial session:', session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setProfile(null);
          setRole(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setProfile(null);
        setRole(null);
      } finally {
        hasInitialized = true;
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
  }, [loadUserData]);

  /**
   * Inscription d'un nouvel utilisateur
   */
  const signUp = async (
    email: string,
    password: string,
    metadata: {
      first_name: string;
      last_name: string;
      role?: 'client' | 'restaurateur';
    }
  ) => {
    try {
      const data = await authService.signUp(email, password, metadata);
      toast({
        title: 'Compte créé !',
        description: 'Bienvenue sur V\'EAT !',
      });
      return data;
    } catch (error: any) {
      toast({
        title: 'Erreur d\'inscription',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  /**
   * Connexion d'un utilisateur
   */
  const signIn = async (email: string, password: string) => {
    try {
      const data = await authService.signIn(email, password);
      toast({
        title: 'Connexion réussie',
        description: 'Content de vous revoir !',
      });
      return data;
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  /**
   * Déconnexion de l'utilisateur
   */
  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);

      toast({
        title: 'Déconnexion',
        description: 'À bientôt !',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur de déconnexion',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  /**
   * Réinitialisation du mot de passe
   */
  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
      toast({
        title: 'Email envoyé',
        description: 'Vérifiez votre boîte mail pour réinitialiser votre mot de passe.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  /**
   * Met à jour le profil utilisateur
   */
  const updateProfile = async (updates: Partial<authService.Profile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const data = await authService.updateProfile(user.id, updates);
      setProfile(data);

      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été enregistrées.',
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
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
