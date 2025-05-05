-- Schema for Lift Tracker application
-- This can be executed in the Supabase SQL Editor

-- IMPORTANT: We're using auth.users directly instead of a custom users table
-- This simplifies the authentication flow and eliminates duplicate user management

-- Drop existing users table if we're migrating from old schema
-- (Uncomment this section if you're migrating from a custom users table)
/*
DROP TABLE IF EXISTS public.sets;
DROP TABLE IF EXISTS public.exercises;
DROP TABLE IF EXISTS public.workouts;
DROP TABLE IF EXISTS public.users;
*/

-- Workouts Table - References auth.users directly
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for workouts
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Exercises Table
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for exercises
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Sets Table
CREATE TABLE IF NOT EXISTS public.sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    weight NUMERIC(10, 2) NOT NULL,
    reps INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for sets
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON public.workouts(date);
CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON public.exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise_id ON public.sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercises_name ON public.exercises(name);

-- Create a function to calculate workout statistics for a user
CREATE OR REPLACE FUNCTION get_workout_stats(user_id_param UUID, start_date_param DATE)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    WITH workout_data AS (
        SELECT 
            COUNT(DISTINCT w.id) AS workout_count,
            COUNT(DISTINCT e.id) AS exercise_count,
            COALESCE(SUM(s.weight * s.reps), 0) AS total_volume
        FROM 
            workouts w
            LEFT JOIN exercises e ON w.id = e.workout_id
            LEFT JOIN sets s ON e.id = s.exercise_id
        WHERE 
            w.user_id = user_id_param
            AND w.date >= start_date_param
    )
    SELECT 
        json_build_object(
            'workout_count', workout_count,
            'exercise_count', exercise_count,
            'total_volume', total_volume
        ) INTO result
    FROM 
        workout_data;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get all exercises for a user with aggregated counts
CREATE OR REPLACE FUNCTION get_user_exercises(user_id_param UUID)
RETURNS TABLE(id UUID, name TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH exercise_counts AS (
        SELECT 
            e.id,
            e.name,
            COUNT(DISTINCT e.workout_id) as count
        FROM 
            exercises e
            JOIN workouts w ON e.workout_id = w.id
        WHERE 
            w.user_id = user_id_param
        GROUP BY 
            e.id, e.name
    )
    SELECT 
        ec.id,
        ec.name,
        ec.count
    FROM 
        exercise_counts ec
    ORDER BY 
        ec.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Row Level Security Policies
-- Users can only see and modify their own data

-- Policies for workouts
CREATE POLICY workouts_select_policy ON public.workouts 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY workouts_insert_policy ON public.workouts 
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY workouts_update_policy ON public.workouts 
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY workouts_delete_policy ON public.workouts 
    FOR DELETE USING (user_id = auth.uid());

-- Policies for exercises (via workouts)
CREATE POLICY exercises_select_policy ON public.exercises 
    FOR SELECT USING (
        workout_id IN (SELECT id FROM public.workouts WHERE user_id = auth.uid())
    );

CREATE POLICY exercises_insert_policy ON public.exercises 
    FOR INSERT WITH CHECK (
        workout_id IN (SELECT id FROM public.workouts WHERE user_id = auth.uid())
    );

CREATE POLICY exercises_update_policy ON public.exercises 
    FOR UPDATE USING (
        workout_id IN (SELECT id FROM public.workouts WHERE user_id = auth.uid())
    );

CREATE POLICY exercises_delete_policy ON public.exercises 
    FOR DELETE USING (
        workout_id IN (SELECT id FROM public.workouts WHERE user_id = auth.uid())
    );

-- Policies for sets (via exercises and workouts)
CREATE POLICY sets_select_policy ON public.sets 
    FOR SELECT USING (
        exercise_id IN (
            SELECT e.id FROM public.exercises e
            JOIN public.workouts w ON e.workout_id = w.id
            WHERE w.user_id = auth.uid()
        )
    );

CREATE POLICY sets_insert_policy ON public.sets 
    FOR INSERT WITH CHECK (
        exercise_id IN (
            SELECT e.id FROM public.exercises e
            JOIN public.workouts w ON e.workout_id = w.id
            WHERE w.user_id = auth.uid()
        )
    );

CREATE POLICY sets_update_policy ON public.sets 
    FOR UPDATE USING (
        exercise_id IN (
            SELECT e.id FROM public.exercises e
            JOIN public.workouts w ON e.workout_id = w.id
            WHERE w.user_id = auth.uid()
        )
    );

CREATE POLICY sets_delete_policy ON public.sets 
    FOR DELETE USING (
        exercise_id IN (
            SELECT e.id FROM public.exercises e
            JOIN public.workouts w ON e.workout_id = w.id
            WHERE w.user_id = auth.uid()
        )
    );

-- Sample data for development purposes only
-- Uncomment this section to add sample data for development

/*
-- Sample workout (you'll need to replace with an actual auth user ID from your system)
INSERT INTO public.workouts (user_id, name, date, notes)
VALUES ('auth-user-id-here', 'Upper Body Strength', '2023-06-01', 'Felt stronger today. Increased bench press weight by 5kg.');

-- Get the workout ID
DO $$
DECLARE
    workout_id UUID;
BEGIN
    SELECT id INTO workout_id FROM public.workouts WHERE user_id = 'auth-user-id-here' AND date = '2023-06-01' LIMIT 1;

    -- Sample exercises
    WITH exercise_ids AS (
        INSERT INTO public.exercises (workout_id, name)
        VALUES 
            (workout_id, 'Bench Press'),
            (workout_id, 'Overhead Press'),
            (workout_id, 'Lat Pulldown')
        RETURNING id, name
    )
    -- Sample sets for each exercise
    INSERT INTO public.sets (exercise_id, weight, reps)
    SELECT 
        e.id,
        CASE 
            WHEN e.name = 'Bench Press' THEN (80 + (5 * series_num))::numeric
            WHEN e.name = 'Overhead Press' THEN (50 + (5 * series_num))::numeric
            WHEN e.name = 'Lat Pulldown' THEN (65 + (5 * series_num))::numeric
        END as weight,
        CASE 
            WHEN series_num = 0 THEN 10
            WHEN series_num = 1 THEN 8
            WHEN series_num = 2 THEN 6
        END as reps
    FROM exercise_ids e
    CROSS JOIN generate_series(0, 2) as series_num;
END $$;
*/ 