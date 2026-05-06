import { createContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/hooks/useAuth';
import type { ViewMode } from '@/hooks/useViewMode';

export interface AuthContextType {
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
  signUp: (email: string, password: string, metadata: { first_name: string; last_name: string; role?: 'client' | 'restaurateur' }) => Promise<unknown>;
  signIn: (email: string, password: string) => Promise<unknown>;
  signInWithOAuth: (provider: 'google', redirectTo: string) => Promise<unknown>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<unknown>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

