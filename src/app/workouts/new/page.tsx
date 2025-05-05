'use client';

import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import useWorkoutForm from '@/hooks/useWorkoutForm';
import DashboardAuthWrapper from '@/components/DashboardAuthWrapper';

export default function NewWorkoutPage() {
  const {
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
  } = useWorkoutForm();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitWorkout();
  };

  return (
    <DashboardAuthWrapper>
      <div className="flex min-h-screen flex-col">
        <Navigation />
        
        <div className="flex-grow p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900">New Workout</h1>
              </div>
              <div className="mt-4 flex md:mt-0">
                <Link
                  href="/workouts"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <div className="bg-white shadow-md rounded-lg p-6">
              <form onSubmit={handleSubmit}>
                {/* Workout Details */}
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Workout Details</h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="workout-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Workout Name
                      </label>
                      <input
                        type="text"
                        id="workout-name"
                        value={workoutInput.name}
                        onChange={(e) => updateWorkoutDetails('name', e.target.value)}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="e.g., Upper Body Strength"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="workout-date" className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        id="workout-date"
                        value={workoutInput.date}
                        onChange={(e) => updateWorkoutDetails('date', e.target.value)}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        id="notes"
                        rows={3}
                        value={workoutInput.notes || ''}
                        onChange={(e) => updateWorkoutDetails('notes', e.target.value)}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="How was the workout? Any issues or achievements to note?"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Exercises Section */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Exercises</h2>
                    <button
                      type="button"
                      onClick={addExercise}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      + Add Exercise
                    </button>
                  </div>
                  
                  {workoutInput.exercises.map((exercise, exerciseIndex) => (
                    <div key={exercise.id} className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-md font-medium text-gray-900">Exercise {exerciseIndex + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeExercise(exercise.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                        <div>
                          <label htmlFor={`exercise-name-${exercise.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Exercise Name
                          </label>
                          <input
                            type="text"
                            id={`exercise-name-${exercise.id}`}
                            value={exercise.name}
                            onChange={(e) => updateExerciseName(exercise.id, e.target.value)}
                            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="e.g., Bench Press"
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Sets */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-700">Sets</h4>
                          <button
                            type="button"
                            onClick={() => addSet(exercise.id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                          >
                            + Add Set
                          </button>
                        </div>
                        
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <div className="grid grid-cols-4 gap-2 mb-2">
                            <div className="text-xs font-medium text-gray-500">Set</div>
                            <div className="text-xs font-medium text-gray-500">Weight (kg)</div>
                            <div className="text-xs font-medium text-gray-500">Reps</div>
                            <div></div>
                          </div>
                          
                          {exercise.sets.map((set, setIndex) => (
                            <div key={set.id} className="grid grid-cols-4 gap-2 items-center mb-2">
                              <div className="text-sm">{setIndex + 1}</div>
                              <input
                                type="number"
                                value={set.weight || 0}
                                onChange={(e) => updateSetDetails(exercise.id, set.id, 'weight', Number(e.target.value))}
                                className="block w-full py-1 px-2 border border-gray-300 bg-white rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                min="0"
                                required
                              />
                              <input
                                type="number"
                                value={set.reps || 0}
                                onChange={(e) => updateSetDetails(exercise.id, set.id, 'reps', Number(e.target.value))}
                                className="block w-full py-1 px-2 border border-gray-300 bg-white rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                min="0"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => removeSet(exercise.id, set.id)}
                                className="text-red-600 hover:text-red-900 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add another exercise button */}
                  <button
                    type="button"
                    onClick={addExercise}
                    className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    + Add Another Exercise
                  </button>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <Link
                    href="/workouts"
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Workout'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardAuthWrapper>
  );
} 