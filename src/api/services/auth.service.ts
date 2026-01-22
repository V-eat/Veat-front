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

import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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

/**
 * Récupère le profil utilisateur depuis la base de données
 */
export async function getProfile(userId: string): Promise<Profile | null> {
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
}

/**
 * Récupère le rôle de l'utilisateur
 */
export async function getUserRole(userId: string): Promise<'client' | 'restaurateur' | 'admin' | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching role:', error);
    return null;
  }
  return data?.role as 'client' | 'restaurateur' | 'admin' | null;
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
 * Met à jour le profil utilisateur
 */
export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

/**
 * Récupère la session actuelle
 */
export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

