import Navigation from '@/components/Navigation';
import Link from 'next/link';

interface PageProps {
  params: {
    id: string;
  };
}

export default function WorkoutDetailPage({ params }: PageProps) {
  // Mock data for the workout
  const workout = {
    id: params.id,
    name: 'Upper Body Strength',
    date: '2023-06-01',
    notes: 'Felt stronger today. Increased bench press weight by 5kg.',
    exercises: [
      {
        id: '1',
        name: 'Bench Press',
        sets: [
          { id: '1', weight: 80, reps: 10 },
          { id: '2', weight: 85, reps: 8 },
          { id: '3', weight: 90, reps: 6 },
        ],
      },
      {
        id: '2',
        name: 'Overhead Press',
        sets: [
          { id: '1', weight: 50, reps: 10 },
          { id: '2', weight: 55, reps: 8 },
          { id: '3', weight: 57.5, reps: 6 },
        ],
      },
      {
        id: '3',
        name: 'Lat Pulldown',
        sets: [
          { id: '1', weight: 65, reps: 12 },
          { id: '2', weight: 70, reps: 10 },
          { id: '3', weight: 75, reps: 8 },
        ],
      },
    ],
  };

  // Calculate some statistics
  const totalExercises = workout.exercises.length;
  const totalSets = workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  const totalVolume = workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.reduce((subtotal, set) => subtotal + set.weight * set.reps, 0);
  }, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <div className="flex-grow p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">{workout.name}</h1>
              <p className="mt-1 text-sm text-gray-500">{workout.date}</p>
            </div>
            <div className="mt-4 flex space-x-3 md:mt-0">
              <Link
                href={`/workouts/${workout.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Edit Workout
              </Link>
              <Link
                href="/workouts"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to All Workouts
              </Link>
            </div>
          </div>
          
          {/* Summary and Notes */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 mb-8">
            {/* Workout Statistics */}
            <div className="lg:col-span-1">
              <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Workout Summary</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Exercises</dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">{totalExercises}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Sets</dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">{totalSets}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Volume</dt>
                      <dd className="mt-1 text-2xl font-semibold text-blue-600">{totalVolume.toLocaleString()} kg</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
            
            {/* Notes */}
            <div className="lg:col-span-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Notes</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <p className="text-gray-700">{workout.notes || 'No notes for this workout.'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Exercises */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Exercises</h2>
          
          <div className="space-y-6">
            {workout.exercises.map((exercise) => (
              <div key={exercise.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">{exercise.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                    {exercise.sets.length} sets
                  </span>
                </div>
                
                <div className="border-t border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Set
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Weight (kg)
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reps
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {exercise.sets.map((set, index) => (
                        <tr key={set.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {set.weight}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {set.reps}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(set.weight * set.reps).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          
          {/* Previous Workouts Comparison */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Exercise History</h2>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Compare With Previous Workouts</h3>
                  <select className="mt-1 block w-48 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <option>Bench Press</option>
                    <option>Overhead Press</option>
                    <option>Lat Pulldown</option>
                  </select>
                </div>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
                  <p className="text-gray-500">Exercise Progress Chart will be displayed here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 