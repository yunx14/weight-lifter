import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseUrl, supabaseAnonKey } from '@/lib/env';

// Add paths that require authentication here
const protectedPaths = [
  '/dashboard',
  '/workouts',
  '/workouts/new',
  '/exercises',
  '/profile',
];

// Public paths that should never redirect
const publicPaths = [
  '/',
  '/auth',
  '/api',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
];

// Extract project reference from supabaseUrl once
const getProjectRef = () => {
  try {
    const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)/);
    return urlMatch ? urlMatch[1] : null;
  } catch (error) {
    console.error('Error extracting project ref:', error);
    return null;
  }
};

// Get project reference for consistent cookie naming
const projectRef = getProjectRef();
const expectedCookieName = projectRef ? `sb-${projectRef}-auth-token` : null;
console.log(`Middleware initialized with expected cookie name: ${expectedCookieName}`);

// Cache authentication results to reduce repeated checks
const authCache = new Map<string, { result: boolean; expires: number }>();
const AUTH_CACHE_TTL = 60 * 1000; // 1 minute cache

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Skip middleware for static assets and API routes to improve performance
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon.ico') || 
      pathname.startsWith('/robots.txt')) {
    return NextResponse.next();
  }
  
  console.log(`==== Middleware executing for path: ${pathname} ====`);

  // Check for infinite redirect loop first
  const url = req.nextUrl.clone();
  const isAuthPage = pathname === '/auth';
  const hasRedirectParam = url.searchParams.has('redirect');

  // Create response with the same headers
  const res = NextResponse.next({
    request: {
      headers: new Headers(req.headers),
    },
  });

  try {
    // Use cached authentication result if available
    const cacheKey = req.cookies.toString();
    const now = Date.now();
    const cachedAuth = authCache.get(cacheKey);
    
    let isAuthenticated = false;
    
    if (cachedAuth && now < cachedAuth.expires) {
      console.log('Using cached authentication result');
      isAuthenticated = cachedAuth.result;
    } else {
      // Check authentication status
      isAuthenticated = await checkAuthentication(req);
      
      // Cache the result
      authCache.set(cacheKey, {
        result: isAuthenticated,
        expires: now + AUTH_CACHE_TTL
      });
      
      // Clean up expired cache entries periodically
      if (authCache.size > 100) {
        for (const [key, value] of authCache.entries()) {
          if (now > value.expires) {
            authCache.delete(key);
          }
        }
      }
    }

    // Main routing logic with more detailed logging
    if (isAuthenticated) {
      // If authenticated and on auth page, redirect to dashboard
      if (isAuthPage) {
        // Redirect to the "redirect" parameter or dashboard
        const redirectTo = hasRedirectParam ? 
          url.searchParams.get('redirect') || '/dashboard' : 
          '/dashboard';
        
        console.log(`Redirecting authenticated user from auth page to: ${redirectTo}`);
        return NextResponse.redirect(new URL(redirectTo, req.url));
      }
      
      // Allow access to all routes for authenticated users
      return res;
    } else {
      // If not authenticated and requesting a protected route
      const isProtectedPath = protectedPaths.some(protectedPath => 
        pathname === protectedPath || pathname.startsWith(`${protectedPath}/`)
      );
      
      if (isProtectedPath) {
        console.log(`Redirecting unauthenticated user from protected path: ${pathname}`);
        const redirectUrl = new URL('/auth', req.url);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
      }
      
      // Allow access to public routes
      return res;
    }
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

// Helper function to check authentication
async function checkAuthentication(req: NextRequest): Promise<boolean> {
  // Debug: Log all cookies in detail
  const allCookies = req.cookies.getAll();
  if (allCookies.length === 0) {
    return false;
  }

  // Find the auth cookie using the expected format or using a more general approach as fallback
  let authCookie = null;

  // Option 1: Try with the expected cookie name if we could extract project ref
  if (expectedCookieName) {
    authCookie = req.cookies.get(expectedCookieName);
    if (authCookie) {
      console.log(`Found auth cookie with expected name: ${expectedCookieName}`);
    }
  }

  // Option 2: If not found or couldn't determine name, look for any Supabase cookie
  if (!authCookie) {
    const authCookiePrefix = 'sb-';
    const authTokenSuffix = '-auth-token';
    
    authCookie = allCookies.find(cookie => 
      cookie.name.startsWith(authCookiePrefix) && 
      cookie.name.endsWith(authTokenSuffix)
    );

    if (authCookie) {
      console.log(`Found generic auth cookie: ${authCookie.name}`);
    }
  }

  if (!authCookie) {
    return false;
  }

  try {
    // Verify the session token
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set() {}, // No-op in middleware
          remove() {}, // No-op in middleware
        },
      }
    );
    
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      console.log('Auth verification failed:', error?.message || 'No user found');
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Error verifying authentication:', e);
    return false;
  }
}

// Specify which paths this middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 