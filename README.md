# Lift Tracker

A full-stack web application built with Next.js, Supabase, and React for tracking weight lifting workouts and monitoring fitness progress.

## Features

- Record weight lifting workouts (exercise name, sets, reps, weight, date)
- View a personalized dashboard with fitness progress over the past 3 months
- Display total volume lifted over time
- Track workout frequency
- Monitor personal records (PRs) for key lifts
- Detailed exercise progress visualizations
- Compare performance across previous workouts

## Tech Stack

- **Frontend**: React, Next.js, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Data Visualization**: Chart.js with react-chartjs-2
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- Supabase account

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/lift-tracker.git
cd lift-tracker
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a Supabase project and set up the database schema:

Create the following tables in your Supabase project:
- users
- workouts
- exercises
- sets

4. Set up environment variables:

Create a `.env.local` file in the project root with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Run the development server:

```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
lift-tracker/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Dashboard page
│   │   ├── exercises/    # Exercise pages
│   │   ├── workouts/     # Workout pages
│   ├── components/       # Reusable React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Library configs
│   ├── utils/            # Utility functions
├── public/               # Static assets
├── .env.local            # Environment variables (create this)
├── package.json
├── tailwind.config.js
└── README.md
```

## Database Schema

### users
- id (primary key)
- email
- created_at

### workouts
- id (primary key)
- user_id (foreign key to users.id)
- date
- name
- notes (optional)
- created_at

### exercises
- id (primary key)
- workout_id (foreign key to workouts.id)
- name
- created_at

### sets
- id (primary key)
- exercise_id (foreign key to exercises.id)
- reps
- weight
- created_at

## Deployment

This project can be deployed to Vercel with minimal configuration:

1. Push your code to a GitHub repository
2. Import the project into Vercel
3. Add your environment variables in the Vercel project settings
4. Deploy!

## License

MIT
