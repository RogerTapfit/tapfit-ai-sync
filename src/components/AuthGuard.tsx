import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
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
  
  console.log('🔐 AuthGuard: Initializing...');
  
  const { profile, loading: profileLoading, needsOnboarding, refetch } = useOnboarding(session?.user?.id);
  
  console.log('🔐 AuthGuard: State =>', { 
    user: !!user, 
    session: !!session, 
    loading, 
    profileLoading, 
    needsOnboarding, 
    error 
  });

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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Connecting to TapFit...</p>
      </div>
    );
  }

  if (!user) {
    console.log('🔐 AuthGuard: No user, showing fallback...');
    return <>{fallback}</>;
  }

  // Show onboarding if user hasn't completed it
  if (needsOnboarding) {
    return (
      <OnboardingFlow 
        userId={user.id} 
        onComplete={() => {
          refetch();
        }}
      />
    );
  }

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
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return { user, session, loading, signOut };
};