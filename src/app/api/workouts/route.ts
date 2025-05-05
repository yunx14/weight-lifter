import { NextRequest, NextResponse } from 'next/server';
import { createWorkout, getWorkouts } from '@/utils/supabase-utils';
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '@/lib/env';

// Extract project reference from supabaseUrl for cookie verification
const getProjectRef = () => {
  try {
    const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)/);
    return urlMatch ? urlMatch[1] : null;
  } catch (error) {
    console.error('Error extracting project ref:', error);
    return null;
  }
};

const projectRef = getProjectRef();
const expectedCookieName = projectRef ? `sb-${projectRef}-auth-token` : 'sb-auth-token';

export async function GET(request: NextRequest) {
  try {
    // Create a new Supabase client for the API route
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get session from the request cookies
    let authCookie = request.cookies.get(expectedCookieName);
    
    // If expected cookie not found, try to find any Supabase auth cookie
    if (!authCookie) {
      const allCookies = request.cookies.getAll();
      console.log('Looking for auth cookie - available cookies:', allCookies.map(c => c.name).join(', '));
      
      const supabaseCookie = allCookies.find(cookie => 
        cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
      );
      
      if (supabaseCookie) {
        console.log(`Found Supabase cookie with name: ${supabaseCookie.name}`);
        authCookie = supabaseCookie;
      }
    }
    
    let authUserId = null;
    
    if (authCookie) {
      console.log(`Verifying user with auth cookie: ${authCookie.name}`);
      // Verify the session if the auth cookie exists
      const { data, error } = await supabase.auth.getUser(authCookie.value);
      if (!error && data.user) {
        authUserId = data.user.id;
        console.log(`Authenticated as user: ${authUserId} (${data.user.email})`);
      } else if (error) {
        console.error('Error verifying user:', error);
      }
    } else {
      console.log('No auth cookie found in request');
    }

    // Require authentication to access this API
    if (!authUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get workouts directly using the auth user ID
    try {
      const workouts = await getWorkouts(authUserId);
      return NextResponse.json(workouts);
    } catch (error) {
      console.error('GET - Error fetching workouts:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve workouts' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/workouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Create a new Supabase client for the API route
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get session from the request cookies
    let authCookie = request.cookies.get(expectedCookieName);
    
    // If expected cookie not found, try to find any Supabase auth cookie
    if (!authCookie) {
      const allCookies = request.cookies.getAll();
      console.log('POST - Looking for auth cookie - available cookies:', allCookies.map(c => c.name).join(', '));
      
      const supabaseCookie = allCookies.find(cookie => 
        cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
      );
      
      if (supabaseCookie) {
        console.log(`POST - Found Supabase cookie with name: ${supabaseCookie.name}`);
        authCookie = supabaseCookie;
      }
    }
    
    let authUserId = null;
    
    if (authCookie) {
      console.log(`POST - Verifying user with auth cookie: ${authCookie.name}`);
      // Verify the session if the auth cookie exists
      const { data, error } = await supabase.auth.getUser(authCookie.value);
      if (!error && data.user) {
        authUserId = data.user.id;
        console.log(`POST - Authenticated as user: ${authUserId} (${data.user.email})`);
      } else if (error) {
        console.error('POST - Error verifying user:', error);
      }
    } else {
      console.log('POST - No auth cookie found in request');
    }

    // Require authentication to access this API
    if (!authUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create workout directly using the auth user ID
    try {
      const data = await request.json();
      console.log('Received workout data:', JSON.stringify(data));
      
      if (!data.name || !data.date || !data.exercises || data.exercises.length === 0) {
        return NextResponse.json(
          { error: 'Invalid workout data' },
          { status: 400 }
        );
      }
      
      const workoutId = await createWorkout(authUserId, {
        name: data.name,
        date: data.date,
        notes: data.notes,
        exercises: data.exercises,
      });
      
      return NextResponse.json({ id: workoutId });
    } catch (error) {
      console.error('POST - Error creating workout:', error);
      return NextResponse.json(
        { error: 'Failed to create workout' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/workouts:', error);
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    );
  }
} 