import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, Profile } from '@/hooks/useAuth';
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
  signUp: (email: string, password: string, metadata: { first_name: string; last_name: string; role?: 'client' | 'restaurateur' }) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
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
