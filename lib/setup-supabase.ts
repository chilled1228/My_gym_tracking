import { supabase } from './supabase';

/**
 * Checks if the required tables exist in Supabase
 */
export async function setupSupabaseTables(): Promise<{ 
  success: boolean; 
  message: string;
  missingTables?: string[];
  sqlScript?: string;
  dismissed?: boolean;
}> {
  try {
    // Check if tables exist by trying to select from them
    const requiredTables = [
      'workout_plans',
      'workout_history',
      'diet_plans',
      'diet_history',
      'macro_history',
      'user_settings'
    ];
    
    const missingTables: string[] = [];
    
    // Check each table
    for (const table of requiredTables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Table exists but no rows
        continue;
      } else if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
        // Table doesn't exist
        missingTables.push(table);
      } else if (error) {
        console.error(`Error checking table ${table}:`, error);
      }
    }
    
    if (missingTables.length === 0) {
      return { success: true, message: 'All required tables exist' };
    }
    
    // Generate SQL script for missing tables
    let sqlScript = `-- Run this SQL in the Supabase SQL Editor to create missing tables\n\n`;
    
    for (const table of missingTables) {
      switch (table) {
        case 'workout_plans':
          sqlScript += `
-- Create workout_plans table
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  days JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own workout plans"
  ON workout_plans FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own workout plans"
  ON workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own workout plans"
  ON workout_plans FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own workout plans"
  ON workout_plans FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

`;
          break;
          
        case 'workout_history':
          sqlScript += `
-- Create workout_history table
CREATE TABLE IF NOT EXISTS workout_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  date DATE NOT NULL,
  workout JSONB NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own workout history"
  ON workout_history FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own workout history"
  ON workout_history FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own workout history"
  ON workout_history FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own workout history"
  ON workout_history FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

`;
          break;
          
        case 'diet_plans':
          sqlScript += `
-- Create diet_plans table
CREATE TABLE IF NOT EXISTS diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  target_calories INTEGER,
  target_protein INTEGER,
  target_carbs INTEGER,
  target_fats INTEGER,
  meals JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own diet plans"
  ON diet_plans FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own diet plans"
  ON diet_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own diet plans"
  ON diet_plans FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own diet plans"
  ON diet_plans FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

`;
          break;
          
        case 'diet_history':
          sqlScript += `
-- Create diet_history table
CREATE TABLE IF NOT EXISTS diet_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  date DATE NOT NULL,
  meals JSONB NOT NULL DEFAULT '[]'::JSONB,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE diet_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own diet history"
  ON diet_history FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own diet history"
  ON diet_history FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own diet history"
  ON diet_history FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own diet history"
  ON diet_history FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

`;
          break;
          
        case 'macro_history':
          sqlScript += `
-- Create macro_history table
CREATE TABLE IF NOT EXISTS macro_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  date DATE NOT NULL,
  calories INTEGER DEFAULT 0,
  protein INTEGER DEFAULT 0,
  carbs INTEGER DEFAULT 0,
  fats INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE macro_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own macro history"
  ON macro_history FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own macro history"
  ON macro_history FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own macro history"
  ON macro_history FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own macro history"
  ON macro_history FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

`;
          break;
          
        case 'user_settings':
          sqlScript += `
-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  current_workout_plan_id UUID,
  current_diet_plan_id UUID,
  storage_preference TEXT DEFAULT 'supabase',
  database_status JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

`;
          break;
      }
    }
    
    return { 
      success: false, 
      message: `Missing tables: ${missingTables.join(', ')}. Please run the SQL script in the Supabase dashboard.`,
      missingTables,
      sqlScript
    };
  } catch (error) {
    console.error('Error checking Supabase tables:', error);
    return { 
      success: false, 
      message: `Error checking Supabase tables: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
} 