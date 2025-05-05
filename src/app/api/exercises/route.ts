import { NextRequest, NextResponse } from 'next/server';
import { getAllExercises } from '@/utils/supabase-utils';
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    // Create a new Supabase client for the API route
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get session from the request cookies
    const authCookie = request.cookies.get('sb-auth-token')?.value;
    let userId = null;
    
    if (authCookie) {
      // Verify the session if the auth cookie exists
      const { data, error } = await supabase.auth.getUser(authCookie);
      if (!error && data.user) {
        userId = data.user.id;
      }
    }

    // Require authentication to access this API
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const exercises = await getAllExercises(userId);
    return NextResponse.json(exercises);
  } catch (error) {
    console.error('Error in GET /api/exercises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
} 