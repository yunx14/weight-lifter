'use client';

import Navigation from '@/components/Navigation';
import Link from 'next/link';
import ExerciseProgressChart from '@/components/ExerciseProgressChart';
import DashboardAuthWrapper from '@/components/DashboardAuthWrapper';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAllExercises, getExerciseHistory } from '@/utils/supabase-utils';
import { format, parseISO } from 'date-fns';

interface PageProps {
  params: {
    id: string;
  };
}

export default function ExerciseDetailPage({ params }: PageProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [exercise, setExercise] = useState<{
    id: string;
    name: string;
    category: string;
    personalBest: {
      weight: number;
      reps: number;
      date: string;
    };
    history: {
      date: string;
      weight: number;
      reps: number;
      sets: number;
      workout_id: string;
    }[];
    relatedExercises: { id: string; name: string }[];
  } | null>(null);

  useEffect(() => {
    async function fetchExerciseData() {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Get all exercises to find the one with the matching ID
        const allExercises = await getAllExercises(user.id);
        const currentExercise = allExercises.find(ex => ex.id === params.id);
        
        if (!currentExercise) {
          console.error('Exercise not found');
          return;
        }
        
        // Get exercise history
        const history = await getExerciseHistory(user.id, currentExercise.name);
        
        // Calculate personal best (max weight lifted)
        let personalBest = { weight: 0, reps: 0, date: '' };
        
        if (history.length > 0) {
          // Find the entry with max weight
          personalBest = history.reduce((max, current) => {
            return current.weight > max.weight ? 
              { weight: current.weight, reps: current.reps, date: current.date } : max;
          }, { weight: 0, reps: 0, date: '' });
        }
        
        // Find related exercises (exercises in same category)
        // For now we'll just return a few other exercises
        const relatedExercises = allExercises
          .filter(ex => ex.id !== params.id)
          .filter(ex => {
            const lowerName = ex.name.toLowerCase();
            const lowerCurrentName = currentExercise.name.toLowerCase();
            
            // Check if they might be in the same category
            const currentCategory = getCategoryForExercise(currentExercise.name);
            const exCategory = getCategoryForExercise(ex.name);
            
            return currentCategory === exCategory;
          })
          .slice(0, 3)
          .map(ex => ({ id: ex.id, name: ex.name }));
        
        setExercise({
          id: currentExercise.id,
          name: currentExercise.name,
          category: getCategoryForExercise(currentExercise.name),
          personalBest,
          history: history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          relatedExercises
        });
        
      } catch (error) {
        console.error('Error fetching exercise data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchExerciseData();
  }, [user, params.id]);

  // Helper function to categorize exercises (this would ideally come from the database)
  const getCategoryForExercise = (name: string): string => {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('bench') || lowerName.includes('chest') || lowerName.includes('fly')) return 'Chest';
    if (lowerName.includes('squat') || lowerName.includes('leg') || lowerName.includes('lunge')) return 'Legs';
    if (lowerName.includes('deadlift') || lowerName.includes('row') || lowerName.includes('pull')) return 'Back';
    if (lowerName.includes('shoulder') || lowerName.includes('press') || lowerName.includes('raise')) return 'Shoulders';
    if (lowerName.includes('curl') || lowerName.includes('extension') || lowerName.includes('tricep')) return 'Arms';
    if (lowerName.includes('crunch') || lowerName.includes('sit') || lowerName.includes('ab')) return 'Core';
    
    return 'Other';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  // Calculate progress (difference between first and last workout)
  const calculateProgress = (history: any[]) => {
    if (history.length < 2) return { value: 0, percentage: 0 };
    
    const oldestWeight = history[history.length - 1].weight;
    const latestWeight = history[0].weight;
    const difference = latestWeight - oldestWeight;
    const percentage = oldestWeight > 0 ? Math.round((difference / oldestWeight) * 100) : 0;
    
    return {
      value: difference,
      percentage
    };
  };

  return (
    <DashboardAuthWrapper>
      <div className="flex min-h-screen flex-col">
        <Navigation />
        
        <div className="flex-grow p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : exercise ? (
              <>
                <div className="md:flex md:items-center md:justify-between mb-6">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-gray-900">{exercise.name}</h1>
                    <p className="mt-1 text-sm text-gray-500">{exercise.category}</p>
                  </div>
                  <div className="mt-4 flex space-x-3 md:mt-0">
                    <Link
                      href="/exercises"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Back to All Exercises
                    </Link>
                  </div>
                </div>
                
                {/* Exercise Overview */}
                <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Exercise Overview</h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Personal Best</dt>
                        <dd className="mt-1 text-xl font-semibold text-blue-600">
                          {exercise.personalBest.weight > 0 ? (
                            <>
                              {exercise.personalBest.weight} kg × {exercise.personalBest.reps}
                              <div className="mt-1 text-xs text-gray-500">
                                Achieved on {formatDate(exercise.personalBest.date)}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-500 text-base">No records yet</span>
                          )}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Total Workouts</dt>
                        <dd className="mt-1 text-xl font-semibold text-gray-900">{exercise.history.length}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Progress</dt>
                        {exercise.history.length > 1 ? (
                          <>
                            <dd className={`mt-1 text-xl font-semibold ${calculateProgress(exercise.history).value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {calculateProgress(exercise.history).value > 0 ? '+' : ''}
                              {calculateProgress(exercise.history).value} kg
                            </dd>
                            <dd className="mt-1 text-xs text-gray-500">
                              {calculateProgress(exercise.history).percentage}% change since first workout
                            </dd>
                          </>
                        ) : (
                          <dd className="mt-1 text-gray-500 text-base">Not enough data</dd>
                        )}
                      </div>
                    </dl>
                  </div>
                </div>
                
                {/* Progress Chart */}
                {exercise.history.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Progress Over Time</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                      <div className="h-64">
                        <ExerciseProgressChart 
                          data={exercise.history} 
                          title={`${exercise.name} Progress`} 
                          chartType="weight"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* History Table */}
                {exercise.history.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Exercise History</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Weight (kg)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reps
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sets
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Volume
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Workout
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {exercise.history.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(item.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.weight}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.reps}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.sets}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(item.weight * item.reps * item.sets).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                <Link href={`/workouts/${item.workout_id}`}>
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md mb-6 p-6">
                    <p className="text-gray-500 text-center">No history available for this exercise yet.</p>
                  </div>
                )}
                
                {/* Related Exercises */}
                {exercise.relatedExercises.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Related Exercises</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {exercise.relatedExercises.map((related) => (
                          <li key={related.id}>
                            <Link
                              href={`/exercises/${related.id}`}
                              className="block hover:bg-gray-50 p-4 rounded-md border border-gray-200"
                            >
                              <div className="font-medium text-blue-600">{related.name}</div>
                              <div className="text-sm text-gray-500">View exercise details</div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-xl font-medium text-gray-900">Exercise not found</h2>
                <p className="mt-2 text-gray-500">The exercise you're looking for doesn't exist or you don't have access to it.</p>
                <div className="mt-6">
                  <Link
                    href="/exercises"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Back to All Exercises
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardAuthWrapper>
  );
} 