import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navigation />
      
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-16 bg-gray-50">
        <div className="text-center max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="block">Track Your Lifting Progress</span>
            <span className="block text-blue-600">Achieve Your Fitness Goals</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Record your weight lifting workouts, track your personal records, and visualize your strength progress over time.
          </p>
          <div className="mt-10 flex gap-x-6 justify-center">
            <Link
              href="/auth"
              className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Get Started
            </Link>
            <Link
              href="/about"
              className="text-sm font-semibold leading-6 text-gray-900 px-3.5 py-2.5"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-900">Track Workouts</h2>
            <p className="mt-2 text-gray-600">
              Log exercises, sets, reps, and weights for each of your workouts.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-900">Visualize Progress</h2>
            <p className="mt-2 text-gray-600">
              See your strength gains with intuitive charts and data visualization.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-900">Celebrate PRs</h2>
            <p className="mt-2 text-gray-600">
              Never miss a personal record with automatic PR tracking.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
