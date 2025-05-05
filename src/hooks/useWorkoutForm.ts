'use client';

import { useState } from 'react';
import { createWorkout } from '@/utils/supabase-utils';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface ExerciseInput {
  id: string;
  name: string;
  sets: {
    id: string;
    weight: number;
    reps: number;
  }[];
}

interface WorkoutInput {
  name: string;
  date: string;
  notes?: string;
  exercises: ExerciseInput[];
}

export default function useWorkoutForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [workoutInput, setWorkoutInput] = useState<WorkoutInput>({
    name: '',
    date: new Date().toISOString().substring(0, 10),
    notes: '',
    exercises: [
      {
        id: '1',
        name: '',
        sets: [
          { id: '1', weight: 0, reps: 0 },
          { id: '2', weight: 0, reps: 0 },
        ],
      },
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update workout details
  const updateWorkoutDetails = (
    field: 'name' | 'date' | 'notes',
    value: string
  ) => {
    setWorkoutInput(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Add a new exercise
  const addExercise = () => {
    setWorkoutInput(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          id: `${prev.exercises.length + 1}`,
          name: '',
          sets: [{ id: '1', weight: 0, reps: 0 }],
        },
      ],
    }));
  };

  // Remove an exercise
  const removeExercise = (exerciseId: string) => {
    setWorkoutInput(prev => ({
      ...prev,
      exercises: prev.exercises.filter(exercise => exercise.id !== exerciseId),
    }));
  };

  // Update exercise name
  const updateExerciseName = (exerciseId: string, name: string) => {
    setWorkoutInput(prev => ({
      ...prev,
      exercises: prev.exercises.map(exercise =>
        exercise.id === exerciseId ? { ...exercise, name } : exercise
      ),
    }));
  };

  // Add a new set to an exercise
  const addSet = (exerciseId: string) => {
    setWorkoutInput(prev => ({
      ...prev,
      exercises: prev.exercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: [
              ...exercise.sets,
              {
                id: `${exercise.sets.length + 1}`,
                weight: 0,
                reps: 0,
              },
            ],
          };
        }
        return exercise;
      }),
    }));
  };

  // Remove a set from an exercise
  const removeSet = (exerciseId: string, setId: string) => {
    setWorkoutInput(prev => ({
      ...prev,
      exercises: prev.exercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: exercise.sets.filter(set => set.id !== setId),
          };
        }
        return exercise;
      }),
    }));
  };

  // Update set details
  const updateSetDetails = (
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: number
  ) => {
    setWorkoutInput(prev => ({
      ...prev,
      exercises: prev.exercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: exercise.sets.map(set => {
              if (set.id === setId) {
                return {
                  ...set,
                  [field]: value,
                };
              }
              return set;
            }),
          };
        }
        return exercise;
      }),
    }));
  };

  // Validate the form
  const validateForm = (): boolean => {
    if (!user) {
      setError('You must be logged in to create a workout');
      return false;
    }

    if (!workoutInput.name.trim()) {
      setError('Workout name is required');
      return false;
    }

    if (!workoutInput.date) {
      setError('Workout date is required');
      return false;
    }

    if (workoutInput.exercises.length === 0) {
      setError('At least one exercise is required');
      return false;
    }

    for (const exercise of workoutInput.exercises) {
      if (!exercise.name.trim()) {
        setError('All exercises must have a name');
        return false;
      }

      if (exercise.sets.length === 0) {
        setError(`Exercise "${exercise.name}" must have at least one set`);
        return false;
      }

      for (const set of exercise.sets) {
        if (set.weight <= 0) {
          setError(`All sets must have a weight greater than 0`);
          return false;
        }

        if (set.reps <= 0) {
          setError(`All sets must have reps greater than 0`);
          return false;
        }
      }
    }

    return true;
  };

  // Submit the form
  const submitWorkout = async () => {
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    if (!user) {
      setError('You must be logged in to create a workout');
      router.push('/auth');
      return;
    }

    setIsSubmitting(true);

    try {
      // Format the data for the API
      const workoutData = {
        name: workoutInput.name,
        date: workoutInput.date,
        notes: workoutInput.notes,
        exercises: workoutInput.exercises.map(exercise => ({
          name: exercise.name,
          sets: exercise.sets.map(set => ({
            weight: set.weight,
            reps: set.reps,
          })),
        })),
      };

      await createWorkout(user.id, workoutData);
      setSuccess(true);
      
      // Redirect to workouts page
      router.push('/workouts');
      
      // Reset the form
      setWorkoutInput({
        name: '',
        date: new Date().toISOString().substring(0, 10),
        notes: '',
        exercises: [
          {
            id: '1',
            name: '',
            sets: [
              { id: '1', weight: 0, reps: 0 },
              { id: '2', weight: 0, reps: 0 },
            ],
          },
        ],
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    workoutInput,
    isSubmitting,
    error,
    success,
    updateWorkoutDetails,
    addExercise,
    removeExercise,
    updateExerciseName,
    addSet,
    removeSet,
    updateSetDetails,
    submitWorkout,
  };
} 