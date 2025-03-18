# Tracker - Fitness & Diet Tracking App

A comprehensive fitness and diet tracking application built with Next.js 15, React 18, TypeScript, and Supabase. Track your workouts, monitor your diet, and visualize your progress with this full-featured, responsive, and offline-capable application.

![Tracker App]()

## 🌟 Features

- **Workout Tracking**: Log exercises, sets, and reps with completion tracking
- **Diet Monitoring**: Plan meals, track macros, and monitor daily calorie intake
- **Progress Visualization**: See your fitness journey with charts and statistics
- **Cloud Synchronization**: Store data in Supabase for access across devices
- **Offline Support**: Continue using the app without an internet connection
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Data Import/Export**: Backup and restore your fitness data

## 📱 Screenshots

<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
  <!-- Add screenshots here -->
</div>

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- A Supabase account (for cloud storage)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tracker.git
   cd tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase credentials

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Radix UI components
- **State Management**: React Context API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (planned)
- **Data Visualization**: Recharts
- **Form Handling**: React Hook Form, Zod validation
- **Utilities**: date-fns, uuid, sonner (toast notifications)

### Directory Structure

```
tracker/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes for backend functionality
│   ├── diet/               # Diet tracking pages
│   ├── workout/            # Workout tracking pages
│   ├── macros/             # Macros tracking pages
│   ├── progress/           # Progress visualization pages
│   ├── settings/           # App settings pages
│   └── layout.tsx          # Root layout component
├── components/             # Reusable React components
│   ├── ui/                 # Shadcn UI components
│   └── ...                 # App-specific components
├── contexts/               # React Context providers
│   └── data-context.tsx    # Data management context
├── lib/                    # Utility functions and services
│   ├── database.ts         # Database operations
│   ├── supabase.ts         # Supabase client setup
│   ├── utils.ts            # Helper functions
│   └── ...                 # Other utilities
├── public/                 # Static assets
└── ...                     # Configuration files
```

## 💾 Data Storage

The app uses a hybrid storage approach:

- **Local Storage**: For offline functionality and quick access
- **Supabase**: For cloud storage, synchronization across devices, and backup

Data operations are handled through the `DataProvider` context, which abstracts storage details from the rest of the application.

## 🗄️ Database Schema

The application uses the following tables in Supabase:

- **workout_plans**: Store workout routines with exercises
- **workout_history**: Track completed workouts by date
- **diet_plans**: Store meal plans with macronutrient targets
- **diet_history**: Track daily food intake
- **macro_history**: Store daily macronutrient totals
- **user_settings**: User preferences and configuration

## ⚙️ Setting Up Supabase

### 1. Create a Supabase Project

1. Sign up or log in at [supabase.com](https://supabase.com)
2. Create a new project and note your project URL and API keys

### 2. Set Up Database Schema

You can set up the database schema in two ways:

#### Option 1: Using the Application

1. Start the application after setting up your Supabase credentials
2. Navigate to Settings > Data Storage
3. Click "Check Tables" to identify missing tables
4. Click "Create Tables" to automatically create the required tables

#### Option 2: Using the SQL Editor

1. Navigate to the SQL Editor in your Supabase dashboard
2. Run the SQL script displayed in the Settings > Data Storage page of the app

### 3. Required Function for Automatic Setup

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

-- Grant execute to authenticated users (service role will still have access)
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
```

## 🔄 Data Migration

If you've been using the app with local storage and want to migrate your data to Supabase:

1. Go to the Settings page in the app
2. Navigate to the "Data Storage" tab
3. Click "Migrate Data" to transfer your local data to Supabase

## 🚨 Common Issues & Troubleshooting

### Supabase Connection Issues

If you encounter problems connecting to Supabase:

1. Check that your `.env.local` file contains the correct Supabase URL and anonymous key
2. Ensure your Supabase project is active and not in maintenance mode
3. Verify that the required tables have been created
4. Check for CORS issues in your browser console

### Missing Tables

If you see "Table does not exist" errors:

1. Go to Settings > Data Storage
2. Follow the instructions to create the missing tables
3. Ensure the exec_sql function has been created in Supabase

### ON CONFLICT Errors

If you see "no unique or exclusion constraint matching" errors, run the following SQL in Supabase:

```sql
-- Add unique constraints
ALTER TABLE diet_history ADD CONSTRAINT diet_history_date_user_id_unique UNIQUE (date, user_id);
ALTER TABLE macro_history ADD CONSTRAINT macro_history_date_user_id_unique UNIQUE (date, user_id);
```

## 🤝 Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

If you have any questions or feedback, please open an issue on GitHub. 