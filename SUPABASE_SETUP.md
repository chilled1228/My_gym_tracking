# Supabase Setup Guide for Tracker

This guide provides detailed instructions for setting up Supabase to work with the Tracker application. Supabase is used for cloud storage, data synchronization, and authentication.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Basic knowledge of SQL and database concepts

## Step 1: Create a Supabase Project

1. Log in to your Supabase account at [supabase.com](https://supabase.com)
2. Click "New Project" from the dashboard
3. Enter a name for your project (e.g., "Tracker")
4. Choose a strong password for the database
5. Select a region close to your users for optimal performance
6. Click "Create new project"

## Step 2: Get Your API Credentials

1. Once your project is created, navigate to the project dashboard
2. Go to Settings → API in the sidebar
3. Note down the following values:
   - Project URL (e.g., `https://xyzproject.supabase.co`)
   - `anon` public API key
   - (Optional) `service_role` key for admin operations

## Step 3: Configure Your Environment Variables

1. Create a `.env.local` file in the root of your project
2. Add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 4: Create the Required Database Function

The application uses a custom SQL function for dynamic database setup. You need to create this function in your Supabase project:

1. Go to the SQL Editor in your Supabase dashboard
2. Run the following SQL:

```sql
-- Create a function to execute SQL statements
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Revoke execute from public
REVOKE EXECUTE ON FUNCTION exec_sql FROM PUBLIC;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
```

## Step 5: Set Up Database Tables

You have two options for creating the required database tables:

### Option 1: Using the Application (Recommended)

1. Start the Tracker application (after setting up environment variables)
2. Navigate to Settings → Data Storage
3. Click "Check Tables" to see if any tables are missing
4. Click "Create Tables" to automatically create them

### Option 2: Manual SQL Execution

If you prefer to set up tables manually:

1. Go to the SQL Editor in your Supabase dashboard
2. Run the following SQL script to create all required tables:

```sql
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

-- Add unique constraints for upsert operations
ALTER TABLE diet_history ADD CONSTRAINT diet_history_date_user_id_unique UNIQUE (date, user_id);
ALTER TABLE macro_history ADD CONSTRAINT macro_history_date_user_id_unique UNIQUE (date, user_id);

-- Temporarily disable RLS for all tables to simplify initial development
ALTER TABLE workout_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE diet_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE macro_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
```

## Step 6: Enable Row-Level Security (RLS)

For production use, you should enable Row-Level Security (RLS) after setting up authentication:

1. Go to the SQL Editor in your Supabase dashboard
2. Run the following SQL to enable RLS with appropriate policies:

```sql
-- Enable RLS for all tables
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for workout_plans
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

-- Similar policies for other tables...
```

> Note: Complete policies for all tables can be found in the app's Settings → Data Storage page.

## Step 7: (Optional) Set Up Authentication

If you want to use Supabase Authentication:

1. Go to Authentication → Settings in your Supabase dashboard
2. Configure the providers you want to support (Email, Google, GitHub, etc.)
3. Set up redirect URLs for your application
4. Update the client code to handle authentication

## Troubleshooting

### "Table Does Not Exist" Errors

If you see errors about missing tables:

1. Check that all required tables have been created
2. Verify table names and capitalization match exactly what's in the application code
3. Try running the table creation SQL again with `IF NOT EXISTS`

### ON CONFLICT Errors

If you see errors like "no unique or exclusion constraint matching the ON CONFLICT specification":

1. Make sure you've added the unique constraints to the tables:
   ```sql
   ALTER TABLE diet_history ADD CONSTRAINT diet_history_date_user_id_unique UNIQUE (date, user_id);
   ALTER TABLE macro_history ADD CONSTRAINT macro_history_date_user_id_unique UNIQUE (date, user_id);
   ```

### RLS Policy Errors

If you see "new row violates row-level security policy" errors:

1. Either disable RLS for development:
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```
2. Or implement policies that properly allow your operations:
   ```sql
   CREATE POLICY "Users can insert rows"
     ON table_name FOR INSERT
     WITH CHECK (true);
   ```

### Connection Issues

If you can't connect to Supabase:

1. Verify your environment variables are set correctly
2. Check if your IP address is allowlisted in Supabase
3. Ensure your project is not in maintenance mode
4. Try clearing browser cache and cookies

## Next Steps

After setting up Supabase, you should:

1. Start the Tracker application
2. Navigate to Settings → Data Storage
3. Check that all tables exist and are correctly configured
4. (Optional) Migrate any existing local data to Supabase

For more advanced Supabase features and configurations, refer to the [Supabase documentation](https://supabase.io/docs). 