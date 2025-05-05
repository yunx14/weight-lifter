'use client';

import { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, checkAuthCookie } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/lib/auth-context';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, refreshSession } = useAuth();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const [isClient, setIsClient] = useState(false);
  const [authMode, setAuthMode] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [redirecting, setRedirecting] = useState(false);
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);

  // Handle successful sign-in
  const handleSuccessfulSignIn = () => {
    // Prevent multiple redirects
    if (redirecting) return;

    console.log('Auth Page - Handling successful sign-in, redirecting to:', redirectTo);
    setRedirecting(true);
    
    // Clear any existing timers
    if (redirectTimer) {
      clearTimeout(redirectTimer);
    }
    
    // Call refreshSession to ensure context is updated
    refreshSession().then(() => {
      console.log('Auth Page - Checking for cookie before redirect');
      // Manually check for the cookie before redirecting
      const hasCookie = checkAuthCookie();
      
      // If we have cookie, redirect with confidence
      if (hasCookie) {
        console.log('Auth Page - Cookie detected, redirecting now');
        router.push(redirectTo);
      } else {
        console.log('Auth Page - No cookie detected yet, will delay redirect');
        // Set a longer timeout for redirect if no cookie is found yet
        const timer = setTimeout(() => {
          console.log('Auth Page - Delayed redirect now happening');
          // Try one more check
          checkAuthCookie();
          router.push(redirectTo);
        }, 1500); // longer delay
        
        setRedirectTimer(timer);
      }
    });
  };

  useEffect(() => {
    // Mark that we're client side rendering and do the initial auth check
    setIsClient(true);
    
    const checkAuth = async () => {
      try {
        console.log('Auth Page - Manually checking for cookie');
        const hasCookie = checkAuthCookie();
        
        if (hasCookie) {
          console.log('Auth Page - Auth cookie found via manual check');
          handleSuccessfulSignIn();
          return;
        }
        
        // Double check with Supabase directly
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth Page - Error getting session:', error);
          return;
        }
        
        if (data?.session) {
          console.log('Auth Page - Session found directly from Supabase');
          handleSuccessfulSignIn();
          return;
        }
      } catch (error) {
        console.error('Auth Page - Unexpected error:', error);
      }
    };

    // If auth context says we have a user, use that
    if (user && !isLoading) {
      console.log('Auth Page - User already signed in from auth context');
      handleSuccessfulSignIn();
    } else {
      // Otherwise, double-check with Supabase directly
      checkAuth();
    }

    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth Page - Auth state changed:', event);
        if (event === 'SIGNED_IN' && session) {
          handleSuccessfulSignIn();
        }
      }
    );

    return () => {
      // Clean up the subscription and any timers
      subscription.unsubscribe();
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [router, redirectTo, user, isLoading]);

  // If not loaded on client yet, show loading state
  if (!isClient) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  // If we're already authenticated or in the process of redirecting, show redirecting message
  if (redirecting || (user && !isLoading)) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Already signed in. Redirecting...</p>
            <p className="mt-2 text-sm text-gray-500">Going to: {redirectTo}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <div className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {authMode === 'sign_in' ? 'Sign in to your account' : 'Create a new account'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {authMode === 'sign_in' ? (
                <>
                  Don't have an account?{' '}
                  <button 
                    onClick={() => setAuthMode('sign_up')}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button 
                    onClick={() => setAuthMode('sign_in')}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
          
          <div className="mt-8">
            <Auth
              supabaseClient={supabase}
              view={authMode}
              appearance={{ 
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#3b82f6',
                      brandAccent: '#2563eb',
                    },
                  },
                },
              }}
              providers={['github']}
              redirectTo={`${window.location.origin}/dashboard`}
              showLinks={false}
              magicLink={true}
              onlyThirdPartyProviders={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 