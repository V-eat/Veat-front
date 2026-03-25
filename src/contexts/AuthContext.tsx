/**
 * Contexte d'authentification
 * 
 * Fournit un contexte React pour gérer l'état d'authentification de l'utilisateur.
 * Encapsule le hook useAuth pour le rendre accessible dans toute l'application.
 * 
 * Fournit :
 * - L'utilisateur actuel et sa session
 * - Le profil utilisateur complet
 * - Le rôle de l'utilisateur (client, restaurateur, admin)
 * - Les méthodes d'authentification (signIn, signUp, signOut, etc.)
 * - Des helpers pour vérifier le type d'utilisateur (isClient, isRestaurateur, etc.)
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, Profile } from '@/hooks/useAuth';
import { useViewMode, ViewMode } from '@/hooks/useViewMode';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: 'client' | 'restaurateur' | 'admin' | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  isRestaurateur: boolean;
  isClient: boolean;
  isAdmin: boolean;
  viewMode: ViewMode;
  toggleViewMode: () => void;
  signUp: (email: string, password: string, metadata: { first_name: string; last_name: string; role?: 'client' | 'restaurateur' }) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { viewMode, toggleViewMode, resetToProMode } = useViewMode();

  // Reset to pro mode on sign-in
  const signIn = async (email: string, password: string) => {
    const result = await auth.signIn(email, password);
    resetToProMode();
    return result;
  };

  return (
    <AuthContext.Provider value={{ ...auth, signIn, viewMode, toggleViewMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Alias for backward compatibility
export { useAuthContext as useAuth };
