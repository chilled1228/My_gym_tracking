-- Create tables for the fitness tracker app

-- Enable RLS (Row Level Security)
alter default privileges revoke execute on functions from public;

-- Set up auth schema
create schema if not exists auth;
create schema if not exists extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- Workout Plans
create table if not exists workout_plans (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  days jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Workout History
create table if not exists workout_history (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  workout jsonb not null,
  completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, date)
);

-- Diet Plans
create table if not exists diet_plans (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  target_calories integer,
  target_protein integer,
  target_carbs integer,
  target_fats integer,
  meals jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Diet History
create table if not exists diet_history (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  meals jsonb not null default '[]'::jsonb,
  completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, date)
);

-- Macro History
create table if not exists macro_history (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  calories integer default 0,
  protein integer default 0,
  carbs integer default 0,
  fats integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, date)
);

-- User Settings
create table if not exists user_settings (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique,
  current_workout_plan_id uuid references workout_plans(id) on delete set null,
  current_diet_plan_id uuid references diet_plans(id) on delete set null,
  storage_preference text default 'local',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table workout_plans enable row level security;
alter table workout_history enable row level security;
alter table diet_plans enable row level security;
alter table diet_history enable row level security;
alter table macro_history enable row level security;
alter table user_settings enable row level security;

-- Create policies for authenticated users
create policy "Users can view their own workout plans"
  on workout_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workout plans"
  on workout_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workout plans"
  on workout_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workout plans"
  on workout_plans for delete
  using (auth.uid() = user_id);

-- Repeat for other tables
create policy "Users can view their own workout history"
  on workout_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workout history"
  on workout_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workout history"
  on workout_history for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workout history"
  on workout_history for delete
  using (auth.uid() = user_id);

create policy "Users can view their own diet plans"
  on diet_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own diet plans"
  on diet_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own diet plans"
  on diet_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own diet plans"
  on diet_plans for delete
  using (auth.uid() = user_id);

create policy "Users can view their own diet history"
  on diet_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own diet history"
  on diet_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own diet history"
  on diet_history for update
  using (auth.uid() = user_id);

create policy "Users can delete their own diet history"
  on diet_history for delete
  using (auth.uid() = user_id);

create policy "Users can view their own macro history"
  on macro_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own macro history"
  on macro_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own macro history"
  on macro_history for update
  using (auth.uid() = user_id);

create policy "Users can delete their own macro history"
  on macro_history for delete
  using (auth.uid() = user_id);

create policy "Users can view their own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on user_settings for update
  using (auth.uid() = user_id);

-- Create anonymous access policies for when users aren't logged in yet
-- This allows the app to work without authentication initially
create policy "Anonymous access to workout plans"
  on workout_plans for all
  using (user_id is null)
  with check (user_id is null);

create policy "Anonymous access to workout history"
  on workout_history for all
  using (user_id is null)
  with check (user_id is null);

create policy "Anonymous access to diet plans"
  on diet_plans for all
  using (user_id is null)
  with check (user_id is null);

create policy "Anonymous access to diet history"
  on diet_history for all
  using (user_id is null)
  with check (user_id is null);

create policy "Anonymous access to macro history"
  on macro_history for all
  using (user_id is null)
  with check (user_id is null);

create policy "Anonymous access to user settings"
  on user_settings for all
  using (user_id is null)
  with check (user_id is null); 