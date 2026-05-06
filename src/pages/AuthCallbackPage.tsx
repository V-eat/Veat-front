import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/api/client';

function pickNamesFromMetadata(metadata: Record<string, any> | null | undefined) {
  const m = metadata ?? {};

  const first =
    (typeof m.first_name === 'string' && m.first_name.trim()) ||
    (typeof m.given_name === 'string' && m.given_name.trim()) ||
    '';

  const last =
    (typeof m.last_name === 'string' && m.last_name.trim()) ||
    (typeof m.family_name === 'string' && m.family_name.trim()) ||
    '';

  if (first || last) return { first_name: first, last_name: last };

  const fullName =
    (typeof m.full_name === 'string' && m.full_name.trim()) ||
    (typeof m.name === 'string' && m.name.trim()) ||
    '';

  if (!fullName) return { first_name: '', last_name: '' };

  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Connexion en cours...');

  const redirect = useMemo(() => {
    const raw = searchParams.get('redirect') || '/';
    return raw.startsWith('/') ? raw : '/';
  }, [searchParams]);

  useEffect(() => {
    const run = async () => {
      try {
        const errorDescription =
          searchParams.get('error_description')
          || searchParams.get('error')
          || null;

        if (errorDescription) {
          setStatus('error');
          setMessage(decodeURIComponent(errorDescription));
          setTimeout(() => navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true }), 1200);
          return;
        }

        const code = searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const user = userData.user;
        if (user) {
          const { first_name, last_name } = pickNamesFromMetadata(user.user_metadata);
          const metadataRole = user.user_metadata?.role;
          const role =
            metadataRole === 'client' || metadataRole === 'restaurateur' || metadataRole === 'admin'
              ? metadataRole
              : 'client';

          // Idempotent côté back (upsert role / insert profile si absent)
          await api.post('/profile/init-on-signup', { first_name, last_name, role }).catch(() => {});
        }

        navigate(redirect, { replace: true });
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.message || 'Impossible de finaliser la connexion OAuth');
        setTimeout(() => navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true }), 1500);
      }
    };

    void run();
  }, [navigate, redirect, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {status === 'loading' ? 'Connexion OAuth' : 'Connexion impossible'}
        </p>
        <p className="mt-2 text-base font-medium text-foreground">{message}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          Vous allez être redirigé automatiquement.
        </p>
      </div>
    </div>
  );
}

