import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';

export type Workout = Database['public']['Tables']['workouts']['Row'];
export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type Set = Database['public']['Tables']['sets']['Row'];

export interface WorkoutWithExercises extends Workout {
  exercises: (Exercise & {
    sets: Set[];
  })[];
}

// Cache for exercise data to reduce database calls
interface ExerciseCache {
  [userId: string]: {
    data: { id: string; name: string; count: number }[];
    timestamp: number;
    expiresIn: number; // in milliseconds
  };
}

const exerciseCache: ExerciseCache = {};
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Gets all workouts for a user
 */
export async function getWorkouts(userId: string): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching workouts', error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Gets a single workout with all exercises and sets in a single query
 * This is more efficient than making separate queries for exercises and sets
 */
export async function getWorkout(workoutId: string): Promise<WorkoutWithExercises | null> {
  // Get the workout with exercises and sets in a single query
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      exercises:exercises(
        *,
        sets:sets(*)
      )
    `)
    .eq('id', workoutId)
    .single();

  if (error) {
    console.error('Error fetching workout with exercises and sets', error);
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return data as WorkoutWithExercises;
}

/**
 * Creates a new workout with exercises and sets
 * Optimized to use fewer database operations by batching inserts
 */
export async function createWorkout(
  userId: string,
  workout: {
    name: string;
    date: string;
    notes?: string;
    exercises: {
      name: string;
      sets: {
        weight: number;
        reps: number;
      }[];
    }[];
  }
): Promise<string> {
  // Insert workout
  const { data: workoutData, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      name: workout.name,
      date: workout.date,
      notes: workout.notes || null,
    })
    .select()
    .single();

  if (workoutError) {
    console.error('Error creating workout', workoutError);
    throw new Error(workoutError.message);
  }

  const workoutId = workoutData.id;

  // Prepare exercise data for batch insert
  const exerciseInserts = workout.exercises.map(exercise => ({
    workout_id: workoutId,
    name: exercise.name,
  }));

  // Batch insert exercises
  const { data: exerciseData, error: exerciseError } = await supabase
    .from('exercises')
    .insert(exerciseInserts)
    .select();

  if (exerciseError) {
    console.error('Error creating exercises', exerciseError);
    throw new Error(exerciseError.message);
  }

  // Map exercise names to IDs for set creation
  const exerciseMap = new Map<string, string>();
  exerciseData.forEach((exercise, index) => {
    exerciseMap.set(workout.exercises[index].name, exercise.id);
  });

  // Prepare all sets for batch insert
  const setInserts: { exercise_id: string; weight: number; reps: number }[] = [];
  
  workout.exercises.forEach(exercise => {
    const exerciseId = exerciseMap.get(exercise.name);
    if (exerciseId) {
      exercise.sets.forEach(set => {
        setInserts.push({
          exercise_id: exerciseId,
          weight: set.weight,
          reps: set.reps,
        });
      });
    }
  });

  // Batch insert all sets
  if (setInserts.length > 0) {
    const { error: setError } = await supabase
      .from('sets')
      .insert(setInserts);

    if (setError) {
      console.error('Error creating sets', setError);
      throw new Error(setError.message);
    }
  }

  return workoutId;
}

/**
 * Updates an existing workout
 */
export async function updateWorkout(
  workoutId: string,
  workout: {
    name?: string;
    date?: string;
    notes?: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from('workouts')
    .update(workout)
    .eq('id', workoutId);

  if (error) {
    console.error('Error updating workout', error);
    throw new Error(error.message);
  }
}

/**
 * Deletes a workout and all associated exercises and sets
 */
export async function deleteWorkout(workoutId: string): Promise<void> {
  // Get all exercises for this workout
  const { data: exercises, error: exercisesError } = await supabase
    .from('exercises')
    .select('id')
    .eq('workout_id', workoutId);

  if (exercisesError) {
    console.error('Error fetching exercises for deletion', exercisesError);
    throw new Error(exercisesError.message);
  }

  // Delete all sets for each exercise
  for (const exercise of exercises || []) {
    const { error: setsError } = await supabase
      .from('sets')
      .delete()
      .eq('exercise_id', exercise.id);

    if (setsError) {
      console.error('Error deleting sets', setsError);
      throw new Error(setsError.message);
    }
  }

  // Delete all exercises
  const { error: exerciseDeleteError } = await supabase
    .from('exercises')
    .delete()
    .eq('workout_id', workoutId);

  if (exerciseDeleteError) {
    console.error('Error deleting exercises', exerciseDeleteError);
    throw new Error(exerciseDeleteError.message);
  }

  // Delete the workout
  const { error: workoutDeleteError } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId);

  if (workoutDeleteError) {
    console.error('Error deleting workout', workoutDeleteError);
    throw new Error(workoutDeleteError.message);
  }
}

/**
 * Gets all unique exercises performed by a user
 * Optimized with caching to reduce database calls
 */
export async function getAllExercises(userId: string): Promise<{ id: string; name: string; count: number }[]> {
  // Check cache first
  const cachedData = exerciseCache[userId];
  const now = Date.now();
  
  if (cachedData && (now - cachedData.timestamp) < cachedData.expiresIn) {
    console.log('Using cached exercise data');
    return cachedData.data;
  }
  
  // If not in cache or expired, fetch from database
  console.log('Fetching exercise data from database');
  
  // First get all workout ids for this user
  const { data: workoutIds, error: workoutError } = await supabase
    .from('workouts')
    .select('id')
    .eq('user_id', userId);
    
  if (workoutError) {
    console.error('Error fetching user workouts', workoutError);
    throw new Error(workoutError.message);
  }
  
  // Extract the IDs into an array
  const workoutIdArray = workoutIds?.map(w => w.id) || [];
  
  if (workoutIdArray.length === 0) {
    // No workouts yet, return empty array
    return [];
  }
  
  // Now get all exercises for these workouts
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, workout_id')
    .in('workout_id', workoutIdArray);

  if (error) {
    console.error('Error fetching user exercises', error);
    throw new Error(error.message);
  }

  // Process the data to count exercise occurrences
  const exerciseCounts: Record<string, { id: string; name: string; count: number }> = {};
  
  for (const exercise of data || []) {
    const key = exercise.name.toLowerCase();
    if (!exerciseCounts[key]) {
      exerciseCounts[key] = {
        id: exercise.id,
        name: exercise.name,
        count: 1
      };
    } else {
      exerciseCounts[key].count++;
    }
  }
  
  // Convert to array and sort by name
  const processedData = Object.values(exerciseCounts).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  // Update cache with the new data
  exerciseCache[userId] = {
    data: processedData,
    timestamp: now,
    expiresIn: CACHE_EXPIRY
  };

  return processedData;
}

/**
 * Gets exercise history for a specific exercise name
 * Optimized to use fewer queries with joins and aggregations
 */
export async function getExerciseHistory(userId: string, exerciseName: string): Promise<{
  date: string;
  weight: number;
  reps: number;
  sets: number;
  workout_id: string;
}[]> {
  // Use a single query with joins to get all the data we need
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      id,
      date,
      exercises!inner(
        id,
        name,
        sets(
          weight,
          reps
        )
      )
    `)
    .eq('user_id', userId)
    .eq('exercises.name', exerciseName)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching exercise history', error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Process the data to get the history records
  const history = data.map(workout => {
    // We know there's at least one exercise with sets
    const exercise = workout.exercises[0];
    const sets = exercise.sets || [];
    
    // Find max weight for the exercise
    let maxWeight = 0;
    let maxReps = 0;
    
    for (const set of sets) {
      if (set.weight > maxWeight) {
        maxWeight = set.weight;
        maxReps = set.reps;
      }
    }

    return {
      date: workout.date,
      weight: maxWeight,
      reps: maxReps,
      sets: sets.length,
      workout_id: workout.id
    };
  });

  return history;
}

/**
 * Gets summary statistics for a user's workouts
 * Optimized to use PostgreSQL aggregations and reduce the number of queries
 */
export async function getWorkoutStats(userId: string, months: number = 3): Promise<{
  totalVolume: number;
  workoutCount: number;
  exerciseCount: number;
  streak: number;
}> {
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  
  // Get workouts with counts using a single query with aggregate functions
  const { data: statsData, error: statsError } = await supabase
    .rpc('get_workout_stats', { 
      user_id_param: userId,
      start_date_param: startDateStr 
    });

  if (statsError) {
    console.error('Error fetching workout stats', statsError);
    throw new Error(statsError.message);
  }

  // Get all workout dates to calculate streak
  const { data: workouts, error: workoutsError } = await supabase
    .from('workouts')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (workoutsError) {
    console.error('Error fetching workouts for streak calculation', workoutsError);
    throw new Error(workoutsError.message);
  }

  // Default values if no data
  const stats = statsData || { workout_count: 0, exercise_count: 0, total_volume: 0 };
  
  // Calculate streak
  let streak = 0;
  if (workouts && workouts.length > 0) {
    const workoutDates = new Set(workouts.map(w => w.date));
    
    // Start with yesterday and count backwards
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    let currentDate = yesterday;
    while (workoutDates.has(currentDate.toISOString().split('T')[0])) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
  }

  return {
    totalVolume: stats.total_volume || 0,
    workoutCount: stats.workout_count || 0,
    exerciseCount: stats.exercise_count || 0,
    streak
  };
} 