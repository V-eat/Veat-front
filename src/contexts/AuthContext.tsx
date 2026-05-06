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

import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useViewMode } from '@/hooks/useViewMode';
import { AuthContext } from '@/contexts/AuthContextBase';

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
