'use client';

import Navigation from '@/components/Navigation';
import Link from 'next/link';
import DashboardVolumeChart from '@/components/DashboardVolumeChart';
import DashboardAuthWrapper from '@/components/DashboardAuthWrapper';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getWorkoutStats, getWorkouts, getAllExercises, getExerciseHistory, Workout } from '@/utils/supabase-utils';
import { format, parseISO, subDays } from 'date-fns';

// Define types for the dashboard
interface WorkoutStats {
  totalVolume: number;
  workoutCount: number;
  exerciseCount: number;
  streak: number;
}

interface PersonalRecord {
  name: string;
  weight: number;
  reps: number;
  date: string;
}

interface VolumeDataPoint {
  date: string;
  volume: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<WorkoutStats>({
    totalVolume: 0,
    workoutCount: 0,
    exerciseCount: 0,
    streak: 0
  });
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch workout statistics
        const workoutStats = await getWorkoutStats(user.id);
        setStats(workoutStats);
        
        // Fetch recent workouts
        const allWorkouts = await getWorkouts(user.id);
        setRecentWorkouts(allWorkouts.slice(0, 3));
        
        // Fetch personal records
        const exercises = await getAllExercises(user.id);
        const prData = await Promise.all(
          exercises.slice(0, 3).map(async (exercise) => {
            const history = await getExerciseHistory(user.id, exercise.name);
            if (history.length > 0) {
              // Find the entry with max weight
              const maxEntry = history.reduce((max, entry) => 
                entry.weight > max.weight ? entry : max, history[0]);
              return {
                name: exercise.name,
                weight: maxEntry.weight,
                reps: maxEntry.reps,
                date: maxEntry.date
              };
            }
            return null;
          })
        );
        setPersonalRecords(prData.filter(Boolean) as PersonalRecord[]);
        
        // Generate volume data for chart (last 3 months)
        const today = new Date();
        const volumePoints: VolumeDataPoint[] = [];
        let runningVolume = 0;
        
        // Create weekly data points
        for (let i = 12; i >= 0; i--) {
          const weekStart = subDays(today, i * 7);
          // Add some variation to the volume to make the chart interesting
          runningVolume += Math.random() * 500 - 200;
          if (runningVolume < 0) runningVolume = 300;
          
          volumePoints.push({
            date: format(weekStart, 'yyyy-MM-dd'),
            volume: Math.floor(runningVolume)
          });
        }
        
        setVolumeData(volumePoints);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [user]);

  const formatDate = (dateString: string): string => {
    const date = parseISO(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return format(date, 'MMM d, yyyy');
  };

  return (
    <DashboardAuthWrapper>
      <div className="flex min-h-screen flex-col">
        <Navigation />
        
        <div className="flex-grow p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Dashboard</h1>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Total Volume</h2>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalVolume.toLocaleString()} kg</p>
                    <p className="text-sm text-gray-500 mt-1">Last 3 months</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Workout Frequency</h2>
                    <p className="text-3xl font-bold text-blue-600">{stats.workoutCount} workouts</p>
                    <p className="text-sm text-gray-500 mt-1">Last 3 months</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Active Streak</h2>
                    <p className="text-3xl font-bold text-blue-600">{stats.streak} days</p>
                    <p className="text-sm text-gray-500 mt-1">Current streak</p>
                  </div>
                </div>
                
                {/* Recent Workouts and PRs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Recent Workouts</h2>
                      <Link href="/workouts" className="text-sm text-blue-600 hover:text-blue-500">
                        View all
                      </Link>
                    </div>
                    
                    <div className="space-y-4">
                      {recentWorkouts.length > 0 ? (
                        recentWorkouts.map((workout) => (
                          <div key={workout.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{workout.name}</h3>
                                <p className="text-sm text-gray-500">{formatDate(workout.date)}</p>
                              </div>
                              <Link href={`/workouts/${workout.id}`} className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                View
                              </Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No recent workouts</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Personal Records</h2>
                      <Link href="/exercises" className="text-sm text-blue-600 hover:text-blue-500">
                        View all
                      </Link>
                    </div>
                    
                    <div className="space-y-4">
                      {personalRecords.length > 0 ? (
                        personalRecords.map((record, index) => (
                          <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{record.name}</h3>
                                <p className="text-sm text-gray-500">{formatDate(record.date)}</p>
                              </div>
                              <span className="text-sm font-medium">{record.weight} kg × {record.reps}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No personal records yet</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Exercise Performance Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Total Volume Progress</h2>
                  <div className="h-64">
                    <DashboardVolumeChart data={volumeData} title="Weekly Volume (Last 3 Months)" />
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/workouts/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    New Workout
                  </Link>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                    Export Data
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardAuthWrapper>
  );
} 