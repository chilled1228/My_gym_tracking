import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Prefer': 'return=representation'
    }
  }
});

// Database types based on the existing interfaces
export type WorkoutExercise = {
  name: string;
  sets: string;
  completed: boolean;
};

export type WorkoutDay = {
  name: string;
  exercises: WorkoutExercise[];
};

export type WorkoutPlan = {
  id: string;
  user_id?: string;
  name: string;
  description: string;
  days: WorkoutDay[];
  created_at?: string;
  updated_at?: string;
};

export type WorkoutHistory = {
  id?: string;
  user_id?: string;
  date: string;
  workout: WorkoutDay;
  completed: boolean;
  created_at?: string;
};

export type MealItem = {
  name: string;
  completed: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type Meal = {
  time: string;
  name: string;
  items: MealItem[];
};

export type DietPlan = {
  id: string;
  user_id?: string;
  name: string;
  description: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  meals: Meal[];
  created_at?: string;
  updated_at?: string;
};

export type DietDay = {
  id?: string;
  user_id?: string;
  date: string;
  meals: Meal[];
  completed: boolean;
  created_at?: string;
};

export type DailyMacros = {
  id?: string;
  user_id?: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  created_at?: string;
}; 