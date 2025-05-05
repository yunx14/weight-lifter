'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Function to refresh the session
  const refreshSession = async () => {
    try {
      console.log('AuthContext - Refreshing session');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('AuthContext - Error refreshing session:', error);
        return;
      }
      
      if (data?.session) {
        console.log('AuthContext - Session refreshed for user:', data.session.user.id);
        setSession(data.session);
        setUser(data.session.user);
      } else {
        console.log('AuthContext - No session found after refresh');
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('AuthContext - Unexpected error during session refresh:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      setIsLoading(true);

      try {
        console.log('AuthContext - Initializing auth...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext - Error getting session:', error);
          return;
        }
        
        if (data?.session) {
          console.log('AuthContext - Session found for user:', data.session.user.id);
          setSession(data.session);
          setUser(data.session.user);
        } else {
          console.log('AuthContext - No session found');
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('AuthContext - Unexpected error during auth initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('AuthContext - Auth state changed:', event);
        
        if (event === 'TOKEN_REFRESHED') {
          // Handle token refresh, which might not update the session properly
          await refreshSession();
        } else if (newSession) {
          console.log('AuthContext - New session for user:', newSession.user.id);
          setSession(newSession);
          setUser(newSession.user);
          
          // No need to ensure user exists in a custom users table anymore
          // We're using auth.users directly now
        } else {
          console.log('AuthContext - No session after auth change');
          setSession(null);
          setUser(null);
        }
        
        setIsLoading(false);
        
        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          console.log('AuthContext - User signed in, refreshing router');
          // Explicitly get session from Supabase to ensure cookies are set properly
          await refreshSession();
          router.refresh();
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthContext - User signed out, refreshing router');
          router.refresh();
        }
      }
    );

    return () => {
      console.log('AuthContext - Unsubscribing from auth state changes');
      subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    try {
      console.log('AuthContext - Signing out user');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      router.push('/');
    } catch (error) {
      console.error('AuthContext - Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 