import { NextRequest, NextResponse } from 'next/server';
import { getExerciseHistory } from '@/utils/supabase-utils';
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
    
    const searchParams = request.nextUrl.searchParams;
    const exerciseName = searchParams.get('name');
    
    if (!exerciseName) {
      return NextResponse.json(
        { error: 'Exercise name is required' },
        { status: 400 }
      );
    }
    
    const history = await getExerciseHistory(userId, exerciseName);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error in GET /api/exercises/history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercise history' },
      { status: 500 }
    );
  }
} 