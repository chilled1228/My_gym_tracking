import { safeGetItem } from './utils';
import {
  saveWorkoutPlan,
  saveWorkoutHistory,
  saveDietPlan,
  saveDietDay,
  saveMacros,
  setCurrentDietPlan
} from './database';
import { supabase } from './supabase';
import type {
  WorkoutPlan,
  WorkoutHistory,
  DietPlan,
  DietDay,
  DailyMacros
} from './supabase';

/**
 * Migrates all data from localStorage to Supabase
 * @returns Object with migration results
 */
export async function migrateToSupabase(): Promise<{
  success: boolean;
  message: string;
  details: {
    workoutPlans: number;
    workoutHistory: number;
    dietPlans: number;
    dietHistory: number;
    macroHistory: number;
  };
}> {
  try {
    const results = {
      success: true,
      message: 'Migration completed successfully',
      details: {
        workoutPlans: 0,
        workoutHistory: 0,
        dietPlans: 0,
        dietHistory: 0,
        macroHistory: 0
      }
    };

    // Migrate workout plans
    const workoutPlans = safeGetItem<WorkoutPlan[]>('workoutPlans', []);
    if (workoutPlans.length > 0) {
      for (const plan of workoutPlans) {
        await saveWorkoutPlan(plan);
      }
      results.details.workoutPlans = workoutPlans.length;
    }

    // Migrate current workout plan
    const currentWorkoutPlan = safeGetItem<string>('currentWorkoutPlan', '');
    if (currentWorkoutPlan) {
      await saveCurrentWorkoutPlan(currentWorkoutPlan);
    }

    // Migrate workout history
    const workoutHistory = safeGetItem<WorkoutHistory[]>('workoutHistory', []);
    if (workoutHistory.length > 0) {
      for (const entry of workoutHistory) {
        await saveWorkoutHistory(entry);
      }
      results.details.workoutHistory = workoutHistory.length;
    }

    // Migrate diet plans
    const dietPlans = safeGetItem<DietPlan[]>('dietPlans', []);
    if (dietPlans.length > 0) {
      for (const plan of dietPlans) {
        await saveDietPlan(plan);
      }
      results.details.dietPlans = dietPlans.length;
    }

    // Migrate current diet plan
    const currentDietPlan = safeGetItem<DietPlan | null>('currentDietPlan', null);
    if (currentDietPlan && currentDietPlan.id) {
      await setCurrentDietPlan(currentDietPlan.id);
    }

    // Migrate diet history
    const dietHistory = safeGetItem<DietDay[]>('dietHistory', []);
    if (dietHistory.length > 0) {
      for (const entry of dietHistory) {
        await saveDietDay(entry);
      }
      results.details.dietHistory = dietHistory.length;
    }

    // Migrate macro history
    const macroHistory = safeGetItem<DailyMacros[]>('macroHistory', []);
    if (macroHistory.length > 0) {
      for (const entry of macroHistory) {
        await saveMacros(entry);
      }
      results.details.macroHistory = macroHistory.length;
    }

    return results;
  } catch (error) {
    console.error('Migration error:', error);
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
      details: {
        workoutPlans: 0,
        workoutHistory: 0,
        dietPlans: 0,
        dietHistory: 0,
        macroHistory: 0
      }
    };
  }
}

/**
 * Helper function to save current workout plan ID to user settings
 */
async function saveCurrentWorkoutPlan(planId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert({ 
        user_id: 'anonymous', // Will be replaced with actual user ID when auth is implemented
        current_workout_plan_id: planId 
      });
    
    if (error) {
      console.error('Error setting current workout plan:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving current workout plan:', error);
    return false;
  }
} 