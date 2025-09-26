import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingFlow } from './OnboardingFlow';
import { useOnboarding } from '@/hooks/useOnboarding';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();
  
  console.log('🔐 AuthGuard: Initializing...');
  console.log('🔐 AuthGuard: Platform:', platform, 'IsNative:', isNative);
  
  const { profile, loading: profileLoading, needsOnboarding, refetch } = useOnboarding(session?.user?.id);
  
  console.log('🔐 AuthGuard: State =>', { 
    user: !!user, 
    session: !!session, 
    loading, 
    profileLoading, 
    needsOnboarding, 
    error,
    platform,
    isNative
  });

  const isGuest = (session?.user as any)?.is_anonymous === true || (typeof window !== 'undefined' && localStorage.getItem('tapfit_guest') === '1');

  useEffect(() => {
    console.log('🔐 AuthGuard: Setting up auth listener...');
    
    try {
      // Set up auth state listener FIRST
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('🔐 AuthGuard: Auth state changed =>', { event, hasSession: !!session });
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          setError(null);
        }
      );

      // THEN check for existing session
      console.log('🔐 AuthGuard: Checking existing session...');
      supabase.auth.getSession()
        .then(({ data: { session }, error }) => {
          if (error) {
            console.error('🔐 AuthGuard: Error getting session =>', error);
            setError('Failed to check authentication status');
          } else {
            console.log('🔐 AuthGuard: Got existing session =>', { hasSession: !!session });
          }
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        })
        .catch((err) => {
          console.error('🔐 AuthGuard: Session check failed =>', err);
          setError('Authentication system unavailable');
          setLoading(false);
        });

      return () => {
        console.log('🔐 AuthGuard: Cleaning up auth listener...');
        subscription.unsubscribe();
      };
    } catch (err) {
      console.error('🔐 AuthGuard: Failed to initialize auth =>', err);
      setError('Authentication system initialization failed');
      setLoading(false);
    }
  }, []);

  // Show error state with fallback option
  if (error) {
    console.error('🔐 AuthGuard: Showing error state =>', error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-destructive">Connection Error</h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry Connection
            </button>
            <div className="text-sm text-muted-foreground">
              <p>Running in offline mode</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || profileLoading) {
    console.log('🔐 AuthGuard: Showing loading state...');
    const LoadingComponent = (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Connecting to TapFit...</p>
        <p className="text-sm text-muted-foreground mt-2">Platform: {platform}</p>
      </div>
    );
    console.log('🔐 AuthGuard: Loading component created, returning...');
    return LoadingComponent;
  }

  if (!user && !isGuest) {
    console.log('🔐 AuthGuard: No user, showing fallback...');
    return <>{fallback}</>;
  }

  // Show onboarding if user hasn't completed it (skip for guest users)
  if (needsOnboarding && !isGuest) {
    console.log('🔐 AuthGuard: User needs onboarding, showing OnboardingFlow...');
    return (
      <OnboardingFlow 
        userId={user.id} 
        onComplete={() => {
          console.log('🔐 AuthGuard: Onboarding completed, refetching...');
          refetch();
        }}
      />
    );
  }

  console.log('🔐 AuthGuard: User authenticated, rendering children...');
  return <>{children}</>;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Clear guest flag if present
      localStorage.removeItem('tapfit_guest');
      // Cleanup auth state to avoid limbo
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
        Object.keys(sessionStorage || {}).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch {}
      // Global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' } as any);
      } catch {}
    } finally {
      window.location.href = '/auth';
    }
  };
  const isGuest = (session?.user as any)?.is_anonymous === true || (typeof window !== 'undefined' && localStorage.getItem('tapfit_guest') === '1');
  return { user, session, loading, isGuest, signOut };

};