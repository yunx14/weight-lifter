'use client';

import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAllExercises, getExerciseHistory } from '@/utils/supabase-utils';
import DashboardAuthWrapper from '@/components/DashboardAuthWrapper';

interface ExerciseWithStats {
  id: string;
  name: string;
  count: number;
  category?: string;
  personalBest?: string;
  lastPerformed?: string;
}

export default function ExercisesPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<ExerciseWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    category: 'all',
    sortBy: 'recent',
    search: ''
  });

  useEffect(() => {
    async function fetchExercises() {
      if (!user) return;

      try {
        setIsLoading(true);
        const exercisesData = await getAllExercises(user.id);
        
        // Get additional stats for each exercise
        const exercisesWithStats = await Promise.all(
          exercisesData.map(async (exercise) => {
            try {
              // Get the exercise history to find personal best and last performed
              const history = await getExerciseHistory(user.id, exercise.name);
              
              // Find personal best (highest weight)
              let personalBest = { weight: 0, reps: 0 };
              let lastPerformedDate = '';
              
              if (history.length > 0) {
                // Sort by date, most recent first for last performed
                const sortedByDate = [...history].sort((a, b) => 
                  new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                lastPerformedDate = sortedByDate[0].date;
                
                // Find max weight for personal best
                personalBest = history.reduce((max, current) => {
                  return current.weight > max.weight ? { weight: current.weight, reps: current.reps } : max;
                }, { weight: 0, reps: 0 });
              }
              
              // Calculate how long ago the exercise was performed
              const lastPerformed = lastPerformedDate ? getTimeAgo(new Date(lastPerformedDate)) : 'Never';
              
              return {
                ...exercise,
                category: getCategoryForExercise(exercise.name),
                personalBest: personalBest.weight > 0 ? `${personalBest.weight} kg × ${personalBest.reps}` : 'None',
                lastPerformed
              };
            } catch (error) {
              console.error(`Error fetching stats for exercise ${exercise.name}:`, error);
              return {
                ...exercise,
                category: getCategoryForExercise(exercise.name),
                personalBest: 'None',
                lastPerformed: 'Never'
              };
            }
          })
        );
        
        setExercises(exercisesWithStats);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExercises();
  }, [user]);

  // Helper function to get time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

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

  // Filter and sort exercises based on user selection
  const filteredExercises = exercises
    .filter(exercise => {
      // Filter by search text
      if (filter.search && !exercise.name.toLowerCase().includes(filter.search.toLowerCase())) {
        return false;
      }
      
      // Filter by category
      if (filter.category !== 'all' && exercise.category !== filter.category) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort exercises
      switch (filter.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'performed':
          return b.count - a.count;
        // Other sorting options could be implemented
        default:
          return 0; // Default no sorting
      }
    });

  return (
    <DashboardAuthWrapper>
      <div className="flex min-h-screen flex-col">
        <Navigation />
        
        <div className="flex-grow p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Exercises</h1>
            
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="category-filter"
                    value={filter.category}
                    onChange={(e) => setFilter({...filter, category: e.target.value})}
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="Chest">Chest</option>
                    <option value="Back">Back</option>
                    <option value="Legs">Legs</option>
                    <option value="Shoulders">Shoulders</option>
                    <option value="Arms">Arms</option>
                    <option value="Core">Core</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    id="sort-by"
                    value={filter.sortBy}
                    onChange={(e) => setFilter({...filter, sortBy: e.target.value})}
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="name">Name A-Z</option>
                    <option value="performed">Most Performed</option>
                  </select>
                </div>
                
                <div className="flex-grow">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={filter.search}
                    onChange={(e) => setFilter({...filter, search: e.target.value})}
                    placeholder="Search exercises..."
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Exercise Cards */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredExercises.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExercises.map((exercise) => (
                  <div key={exercise.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">{exercise.name}</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">{exercise.category}</p>
                    </div>
                    <div className="px-4 py-5 sm:px-6">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Times Performed</dt>
                          <dd className="mt-1 text-sm text-gray-900">{exercise.count} workouts</dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Last Performed</dt>
                          <dd className="mt-1 text-sm text-gray-900">{exercise.lastPerformed}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Personal Best</dt>
                          <dd className="mt-1 text-sm text-blue-600 font-semibold">{exercise.personalBest}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-4 sm:px-6 flex justify-end">
                      <Link 
                        href={`/exercises/${exercise.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        View Progress
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No exercises found</p>
                <Link
                  href="/workouts/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Your First Workout
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardAuthWrapper>
  );
} 