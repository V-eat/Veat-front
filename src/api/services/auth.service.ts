/**
 * Service d'authentification
 * 
 * Gère toutes les opérations liées à l'authentification des utilisateurs :
 * - Inscription (signUp)
 * - Connexion (signIn)
 * - Déconnexion (signOut)
 * - Réinitialisation de mot de passe
 * - Gestion des profils utilisateurs
 */

import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/api/client';

export type OAuthProvider = 'google';

export interface NotificationPreferences {
  email_orders: boolean;
  email_promotions: boolean;
  email_news: boolean;
}

export interface ProfileSettings {
  language: 'fr' | 'en';
  theme: 'light' | 'dark' | 'system';
}

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
  notification_preferences: NotificationPreferences | null;
  settings: ProfileSettings | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  role: 'client' | 'restaurateur' | 'admin';
}

/**
 * Récupère le profil utilisateur via le backend
 */
export async function getProfile(_userId: string): Promise<Profile | null> {
  try {
    return await api.get<Profile>('/profile');
  } catch {
    return null;
  }
}

/**
 * Récupère le rôle de l'utilisateur via le backend
 */
export async function getUserRole(_userId: string): Promise<'client' | 'restaurateur' | 'admin' | null> {
  try {
    const data = await api.get<{ role: string }>('/profile/role');
    return data.role as 'client' | 'restaurateur' | 'admin';
  } catch {
    return null;
  }
}

/**
 * Inscription d'un nouvel utilisateur
 */
export async function signUp(
  email: string,
  password: string,
  metadata: {
    first_name: string;
    last_name: string;
    role?: 'client' | 'restaurateur';
  }
) {
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

  if (error) throw error;
  return data;
}

/**
 * Connexion d'un utilisateur
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Connexion via OAuth (Google / Apple).
 *
 * Le redirectTo doit pointer vers une route front qui fera l'échange du code (PKCE)
 * puis redirigera l'utilisateur (ex: /auth/callback?redirect=/checkout).
 */
export async function signInWithOAuth(provider: OAuthProvider, redirectTo: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Déconnexion de l'utilisateur actuel
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Réinitialisation du mot de passe par email
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}

/**
 * Met à jour le profil utilisateur via le backend
 */
export async function updateProfile(_userId: string, updates: Partial<Profile>): Promise<Profile> {
  return api.put<Profile>('/profile', updates);
}

/**
 * Récupère la session actuelle
 */
export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

