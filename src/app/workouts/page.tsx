'use client';

import Navigation from '@/components/Navigation';
import Link from 'next/link';
import DashboardAuthWrapper from '@/components/DashboardAuthWrapper';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getWorkouts, getWorkout, Workout } from '@/utils/supabase-utils';
import { format, parseISO } from 'date-fns';

interface WorkoutWithCount extends Workout {
  exerciseCount: number;
}

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    dateRange: 'all',
    workoutType: 'all',
    search: ''
  });

  useEffect(() => {
    async function fetchWorkouts() {
      if (!user) return;

      try {
        setIsLoading(true);
        const workoutsData = await getWorkouts(user.id);
        
        // Get counts of exercises per workout
        const workoutsWithExerciseCounts = await Promise.all(
          workoutsData.map(async (workout) => {
            try {
              // Get the full workout details to count exercises
              const workoutDetails = await getWorkout(workout.id);
              return {
                ...workout,
                exerciseCount: workoutDetails?.exercises?.length || 0
              };
            } catch (error) {
              console.error(`Error fetching exercise count for workout ${workout.id}:`, error);
              return {
                ...workout,
                exerciseCount: 0
              };
            }
          })
        );
        
        setWorkouts(workoutsWithExerciseCounts);
      } catch (error) {
        console.error('Error fetching workouts:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkouts();
  }, [user]);

  // Filter workouts based on current filters
  const filteredWorkouts = workouts.filter(workout => {
    // Filter by search text
    if (filter.search && !workout.name.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    
    // Filter by workout type (in a real implementation, you'd have workout types)
    if (filter.workoutType !== 'all' && !workout.name.toLowerCase().includes(filter.workoutType.toLowerCase())) {
      return false;
    }
    
    // Filter by date range
    if (filter.dateRange !== 'all') {
      const workoutDate = new Date(workout.date);
      const now = new Date();
      
      switch (filter.dateRange) {
        case '30days':
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          if (workoutDate < thirtyDaysAgo) return false;
          break;
        case '3months':
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          if (workoutDate < threeMonthsAgo) return false;
          break;
        case '6months':
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(now.getMonth() - 6);
          if (workoutDate < sixMonthsAgo) return false;
          break;
        case 'year':
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          if (workoutDate < oneYearAgo) return false;
          break;
      }
    }
    
    return true;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy');
  };

  return (
    <DashboardAuthWrapper>
      <div className="flex min-h-screen flex-col">
        <Navigation />
        
        <div className="flex-grow p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Your Workouts</h1>
              <Link
                href="/workouts/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                New Workout
              </Link>
            </div>
            
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    id="date-filter"
                    value={filter.dateRange}
                    onChange={(e) => setFilter({...filter, dateRange: e.target.value})}
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="all">All time</option>
                    <option value="30days">Last 30 days</option>
                    <option value="3months">Last 3 months</option>
                    <option value="6months">Last 6 months</option>
                    <option value="year">This year</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="workout-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Workout Type
                  </label>
                  <select
                    id="workout-type"
                    value={filter.workoutType}
                    onChange={(e) => setFilter({...filter, workoutType: e.target.value})}
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="upper">Upper Body</option>
                    <option value="lower">Lower Body</option>
                    <option value="push">Push</option>
                    <option value="pull">Pull</option>
                    <option value="legs">Legs</option>
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
                    placeholder="Search workouts..."
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Workouts List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredWorkouts.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredWorkouts.map((workout) => (
                      <tr key={workout.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{workout.name}</div>
                          {workout.notes && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">{workout.notes}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(workout.date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/workouts/${workout.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                            View
                          </Link>
                          <Link href={`/workouts/${workout.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                            Edit
                          </Link>
                          <button className="text-red-600 hover:text-red-900">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No workouts found</p>
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
      </div>
    </DashboardAuthWrapper>
  );
} 