import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './env';

// Extract project reference from the URL
const getProjectRef = () => {
  try {
    // Extract the project reference from the URL
    const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)/);
    return urlMatch ? urlMatch[1] : null;
  } catch (error) {
    console.error('Error extracting project ref:', error);
    return null;
  }
};

const projectRef = getProjectRef();
console.log(`Supabase project reference: ${projectRef}`);

// Calculate the expected cookie name
export const supabaseCookieName = projectRef ? `sb-${projectRef}-auth-token` : 'sb-auth-token';
console.log(`Expected cookie name: ${supabaseCookieName}`);

// Create a single supabase client for the browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE auth flow for better security
    // Storage must be explicitly set to 'cookie' to use cookies
    storage: {
      getItem: (key) => {
        if (typeof document === 'undefined') return null;
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${key}=`))
          ?.split('=')[1];
        return value ? decodeURIComponent(value) : null;
      },
      setItem: (key, value) => {
        if (typeof document === 'undefined') return;
        const maxAge = 100 * 365 * 24 * 60 * 60; // 100 years, never expires
        document.cookie = `${key}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
      },
      removeItem: (key) => {
        if (typeof document === 'undefined') return;
        document.cookie = `${key}=;path=/;max-age=0;SameSite=Lax`;
      }
    },
  },
  global: {
    fetch: (...args) => {
      // Log the request URL for debugging
      console.log(`Supabase request to: ${args[0]}`);
      return fetch(...args);
    },
  },
});

// Debug: Log the current auth session to understand state
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Supabase auth state changed: ${event}`);
  if (session) {
    console.log(`Auth session exists for user: ${session.user.id}`);
    // Log when the session will expire
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      console.log(`Session expires at: ${expiresAt.toLocaleString()}`);
    } else {
      console.log('Session expiration time not available');
    }
  } else {
    console.log('No auth session exists');
  }
});

// Helper function to manually check if the auth cookie exists
export const checkAuthCookie = () => {
  if (typeof document === 'undefined') return false;
  
  const cookieExists = document.cookie.split(';').some(c => {
    return c.trim().startsWith(`${supabaseCookieName}=`);
  });
  console.log(`Manual cookie check: ${supabaseCookieName} ${cookieExists ? 'exists' : 'not found'}`);
  return cookieExists;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          name: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          name: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          name?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      exercises: {
        Row: {
          id: string;
          workout_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      sets: {
        Row: {
          id: string;
          exercise_id: string;
          reps: number;
          weight: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          reps: number;
          weight: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          exercise_id?: string;
          reps?: number;
          weight?: number;
          created_at?: string;
        };
      };
    };
  };
}; 