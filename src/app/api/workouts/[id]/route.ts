import { NextRequest, NextResponse } from 'next/server';
import { getWorkout, updateWorkout, deleteWorkout } from '@/utils/supabase-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workoutId = params.id;
    const workout = await getWorkout(workoutId);
    
    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(workout);
  } catch (error) {
    console.error(`Error in GET /api/workouts/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch workout' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workoutId = params.id;
    const data = await request.json();
    
    await updateWorkout(workoutId, {
      name: data.name,
      date: data.date,
      notes: data.notes,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error in PUT /api/workouts/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update workout' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workoutId = params.id;
    await deleteWorkout(workoutId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error in DELETE /api/workouts/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    );
  }
} 