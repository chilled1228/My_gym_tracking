import { supabase } from './supabase';
import type { 
  WorkoutPlan, 
  WorkoutHistory, 
  DietPlan, 
  DietDay, 
  DailyMacros,
  Meal,
  MealItem
} from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { getLocalDateString } from './utils';

// Save status callback type
export type SaveStatusCallback = {
  onSaving?: () => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

// Helper function to check Supabase connection
export async function checkSupabaseConnection(): Promise<{ 
  connected: boolean; 
  error?: Error;
  details?: string;
}> {
  try {
    console.log('Checking Supabase connection...');
    
    // Try to access the macro_history table instead of _rpc
    const { data, error } = await supabase.from('macro_history').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.error('Supabase connection error:', error);
      return { 
        connected: false, 
        error: handleSupabaseError('Checking connection', error),
        details: JSON.stringify(error, null, 2)
      };
    }
    
    // If we get here, the connection is working
    console.log('Supabase connection successful');
    return { connected: true };
  } catch (error) {
    console.error('Exception checking Supabase connection:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      connected: false, 
      error: createDetailedError(`Failed to connect to Supabase: ${errorMessage}`, error),
      details: error instanceof Error ? error.stack : JSON.stringify(error, null, 2)
    };
  }
}

// Helper function to check if a table exists
async function tableExists(tableName: string): Promise<boolean> {
  try {
    console.log(`Checking if table ${tableName} exists...`);
    
    // Try to select from the table directly instead of querying information_schema
    // This is more likely to work with restricted permissions
    const { error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1)
      .single();
    
    // If there's no error or the error is just "no rows found", the table exists
    if (!error || error.code === 'PGRST116') {
      console.log(`Table ${tableName} exists (verified by direct query)`);
      return true;
    }
    
    // If the error indicates the table doesn't exist
    if (error.code === '42P01' || (error.message && error.message.includes('relation') && error.message.includes('does not exist'))) {
      console.warn(`Table ${tableName} does not exist`);
      return false;
    }
    
    // For other errors, log them but assume the table might exist
    console.error(`Error checking if table ${tableName} exists:`, error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Default to false for safety
    return false;
  } catch (error) {
    console.error(`Exception checking if table ${tableName} exists:`, error);
    console.error('Error details:', error instanceof Error 
      ? { message: error.message, stack: error.stack } 
      : JSON.stringify(error, null, 2));
    return false;
  }
}

// User management - for future authentication implementation
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.id) {
      return user.id;
    }
    
    // If no authenticated user, check for fallback ID in browser environment
    if (typeof window !== 'undefined') {
      const fallbackUserId = localStorage.getItem('fallbackUserId');
      if (fallbackUserId) {
        console.log('Using fallback user ID:', fallbackUserId);
        return fallbackUserId;
      }
      
      // If no fallback ID exists, create one
      if (!fallbackUserId) {
        const newFallbackId = crypto.randomUUID ? crypto.randomUUID() : uuidv4();
        localStorage.setItem('fallbackUserId', newFallbackId);
        console.log('Created new fallback user ID:', newFallbackId);
        return newFallbackId;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

// Workout Plans
export async function getWorkoutPlans(): Promise<WorkoutPlan[]> {
  // Check if table exists first
  if (!await tableExists('workout_plans')) {
    console.warn('workout_plans table does not exist');
    return [];
  }

  const { data, error } = await supabase
    .from('workout_plans')
    .select('*');
  
  if (error) {
    console.error('Error fetching workout plans:', error);
    return [];
  }
  
  return data || [];
}

export async function getWorkoutPlan(id: string): Promise<WorkoutPlan | null> {
  // Check if table exists first
  if (!await tableExists('workout_plans')) {
    console.warn('workout_plans table does not exist');
    return null;
  }

  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching workout plan ${id}:`, error);
    return null;
  }
  
  return data;
}

export async function saveWorkoutPlan(
  plan: WorkoutPlan, 
  statusCallbacks?: SaveStatusCallback
): Promise<boolean> {
  try {
    // Notify saving
    statusCallbacks?.onSaving?.();
    
    // Check if table exists first
    if (!await tableExists('workout_plans')) {
      console.warn('workout_plans table does not exist');
      statusCallbacks?.onError?.(new Error('Workout plans table does not exist'));
      return false;
    }

    // Add user_id if not present
    if (!plan.user_id) {
      const userId = await getCurrentUserId();
      if (userId) {
        plan.user_id = userId;
      }
    }

    const { error } = await supabase
      .from('workout_plans')
      .upsert(plan, { onConflict: 'id' });
    
    if (error) {
      console.error('Error saving workout plan:', error);
      statusCallbacks?.onError?.(error);
      return false;
    }
    
    // Notify success
    statusCallbacks?.onSuccess?.();
    return true;
  } catch (error) {
    console.error('Error saving workout plan:', error);
    statusCallbacks?.onError?.(error);
    return false;
  }
}

export async function deleteWorkoutPlan(
  id: string,
  statusCallbacks?: SaveStatusCallback
): Promise<boolean> {
  try {
    // Notify saving
    statusCallbacks?.onSaving?.();
    
    // Check if table exists first
    if (!await tableExists('workout_plans')) {
      console.warn('workout_plans table does not exist');
      statusCallbacks?.onError?.(new Error('Workout plans table does not exist'));
      return false;
    }

    const { error } = await supabase
      .from('workout_plans')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting workout plan ${id}:`, error);
      statusCallbacks?.onError?.(error);
      return false;
    }
    
    // Notify success
    statusCallbacks?.onSuccess?.();
    return true;
  } catch (error) {
    console.error(`Error deleting workout plan ${id}:`, error);
    statusCallbacks?.onError?.(error);
    return false;
  }
}

// Workout History
export async function getWorkoutHistory(limit?: number): Promise<WorkoutHistory[]> {
  // Check if table exists first
  if (!await tableExists('workout_history')) {
    console.warn('workout_history table does not exist');
    return [];
  }

  let query = supabase
    .from('workout_history')
    .select('*')
    .order('date', { ascending: false });
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching workout history:', error);
    return [];
  }
  
  return data || [];
}

export async function getWorkoutForDate(date: string): Promise<WorkoutHistory | null> {
  // Check if table exists first
  if (!await tableExists('workout_history')) {
    console.warn('workout_history table does not exist');
    return null;
  }

  const { data, error } = await supabase
    .from('workout_history')
    .select('*')
    .eq('date', date)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching workout for date ${date}:`, error);
    return null;
  }
  
  return data || null;
}

export async function saveWorkoutHistory(
  workout: WorkoutHistory,
  statusCallbacks?: SaveStatusCallback
): Promise<boolean> {
  try {
    // Notify saving
    statusCallbacks?.onSaving?.();
    
    // Check if table exists first
    if (!await tableExists('workout_history')) {
      console.warn('workout_history table does not exist');
      statusCallbacks?.onError?.(new Error('Workout history table does not exist'));
      return false;
    }

    // Add user_id if not present
    if (!workout.user_id) {
      const userId = await getCurrentUserId();
      if (userId) {
        workout.user_id = userId;
      }
    }

    const { error } = await supabase
      .from('workout_history')
      .upsert(workout, { 
        onConflict: 'date,user_id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('Error saving workout history:', error);
      statusCallbacks?.onError?.(error);
      return false;
    }
    
    // Notify success
    statusCallbacks?.onSuccess?.();
    return true;
  } catch (error) {
    console.error('Error saving workout history:', error);
    statusCallbacks?.onError?.(error);
    return false;
  }
}

// Diet Plans
export async function getDietPlans(): Promise<DietPlan[]> {
  // Check if table exists first
  if (!await tableExists('diet_plans')) {
    console.warn('diet_plans table does not exist');
    return [];
  }

  const { data, error } = await supabase
    .from('diet_plans')
    .select('*');
  
  if (error) {
    console.error('Error fetching diet plans:', error);
    return [];
  }
  
  return data || [];
}

export async function getDietPlan(id: string): Promise<DietPlan | null> {
  // Check if table exists first
  if (!await tableExists('diet_plans')) {
    console.warn('diet_plans table does not exist');
    return null;
  }

  const { data, error } = await supabase
    .from('diet_plans')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching diet plan ${id}:`, error);
    return null;
  }
  
  return data;
}

export async function getCurrentDietPlan(): Promise<DietPlan | null> {
  // Check if tables exist first
  if (!await tableExists('user_settings') || !await tableExists('diet_plans')) {
    console.warn('user_settings or diet_plans table does not exist');
    return null;
  }

  const userId = await getCurrentUserId();
  if (!userId) return null;

  // Get current diet plan ID from user settings
  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('current_diet_plan_id')
    .eq('user_id', userId)
    .single();
  
  if (settingsError || !settings?.current_diet_plan_id) {
    return null;
  }
  
  // Get the diet plan
  return getDietPlan(settings.current_diet_plan_id);
}

export async function setCurrentDietPlan(
  planId: string,
  statusCallbacks?: SaveStatusCallback
): Promise<boolean> {
  try {
    // Notify saving
    statusCallbacks?.onSaving?.();
    
    // Check if table exists first
    if (!await tableExists('user_settings')) {
      console.warn('user_settings table does not exist');
      statusCallbacks?.onError?.(new Error('User settings table does not exist'));
      return false;
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      statusCallbacks?.onError?.(new Error('User not authenticated'));
      return false;
    }

    // Check if user settings exist
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    let result;
    
    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from('user_settings')
        .update({ current_diet_plan_id: planId })
        .eq('user_id', userId);
    } else {
      // Create new settings
      result = await supabase
        .from('user_settings')
        .insert({ 
          user_id: userId, 
          current_diet_plan_id: planId,
          storage_preference: 'supabase'
        });
    }
    
    if (result.error) {
      console.error('Error setting current diet plan:', result.error);
      statusCallbacks?.onError?.(result.error);
      return false;
    }
    
    // Notify success
    statusCallbacks?.onSuccess?.();
    return true;
  } catch (error) {
    console.error('Error setting current diet plan:', error);
    statusCallbacks?.onError?.(error);
    return false;
  }
}

export async function saveDietPlan(
  plan: DietPlan,
  statusCallbacks?: SaveStatusCallback
): Promise<boolean> {
  try {
    // Notify saving
    statusCallbacks?.onSaving?.();
    
    // Check if table exists first
    if (!await tableExists('diet_plans')) {
      console.warn('diet_plans table does not exist');
      statusCallbacks?.onError?.(new Error('Diet plans table does not exist'));
      return false;
    }

    // Add user_id if not present
    if (!plan.user_id) {
      const userId = await getCurrentUserId();
      if (userId) {
        plan.user_id = userId;
      }
    }

    const { error } = await supabase
      .from('diet_plans')
      .upsert(plan, { onConflict: 'id' });
    
    if (error) {
      console.error('Error saving diet plan:', error);
      statusCallbacks?.onError?.(error);
      return false;
    }
    
    // Notify success
    statusCallbacks?.onSuccess?.();
    return true;
  } catch (error) {
    console.error('Error saving diet plan:', error);
    statusCallbacks?.onError?.(error);
    return false;
  }
}

export async function deleteDietPlan(
  id: string,
  statusCallbacks?: SaveStatusCallback
): Promise<boolean> {
  try {
    // Notify saving
    statusCallbacks?.onSaving?.();
    
    // Check if table exists first
    if (!await tableExists('diet_plans')) {
      console.warn('diet_plans table does not exist');
      statusCallbacks?.onError?.(new Error('Diet plans table does not exist'));
      return false;
    }

    const { error } = await supabase
      .from('diet_plans')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting diet plan ${id}:`, error);
      statusCallbacks?.onError?.(error);
      return false;
    }
    
    // Notify success
    statusCallbacks?.onSuccess?.();
    return true;
  } catch (error) {
    console.error(`Error deleting diet plan ${id}:`, error);
    statusCallbacks?.onError?.(error);
    return false;
  }
}

// Diet History
export async function getDietHistory(limit?: number): Promise<DietDay[]> {
  // Check if table exists first
  if (!await tableExists('diet_history')) {
    console.warn('diet_history table does not exist');
    return [];
  }

  let query = supabase
    .from('diet_history')
    .select('*')
    .order('date', { ascending: false });
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching diet history:', error);
    return [];
  }
  
  return data || [];
}

export async function getDietForDate(date: string): Promise<DietDay | null> {
  // Check if table exists first
  if (!await tableExists('diet_history')) {
    console.warn('diet_history table does not exist');
    return null;
  }

  const { data, error } = await supabase
    .from('diet_history')
    .select('*')
    .eq('date', date)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching diet for date ${date}:`, error);
    return null;
  }
  
  return data || null;
}

export async function saveDietDay(
  dietDay: DietDay,
  statusCallbacks?: SaveStatusCallback
): Promise<boolean> {
  try {
    // Notify saving
    statusCallbacks?.onSaving?.();
    
    // Check if table exists first
    if (!await tableExists('diet_history')) {
      const errorMsg = 'Diet history table does not exist';
      console.warn(errorMsg);
      statusCallbacks?.onError?.(createDetailedError(errorMsg));
      return false;
    }

    // Validate the date format
    if (!dietDay.date || !/^\d{4}-\d{2}-\d{2}$/.test(dietDay.date)) {
      const errorMsg = `Invalid date format: ${dietDay.date}. Expected YYYY-MM-DD`;
      console.error(errorMsg);
      statusCallbacks?.onError?.(createDetailedError(errorMsg));
      return false;
    }

    // Add user_id if not present
    if (!dietDay.user_id) {
      const userId = await getCurrentUserId();
      if (userId) {
        dietDay.user_id = userId;
      } else {
        // Check if we're in a browser environment
        if (typeof window !== 'undefined') {
          // Use a fallback user ID from localStorage if available
          const fallbackUserId = localStorage.getItem('fallbackUserId');
          
          if (fallbackUserId) {
            dietDay.user_id = fallbackUserId;
            console.log('Using fallback user ID for diet day:', fallbackUserId);
          } else {
            // Generate a new fallback user ID and store it
            const newFallbackId = crypto.randomUUID ? crypto.randomUUID() : uuidv4();
            localStorage.setItem('fallbackUserId', newFallbackId);
            dietDay.user_id = newFallbackId;
            console.log('Created new fallback user ID for diet day:', newFallbackId);
          }
        } else {
          // We're on the server side, use a temporary ID
          dietDay.user_id = uuidv4();
          console.log('Using temporary user ID for diet day on server side');
        }
      }
    }

    // Ensure meals is an array
    if (!Array.isArray(dietDay.meals)) {
      dietDay.meals = [];
      console.warn('Diet day meals was not an array, setting to empty array');
    }
    
    // Sanitize meals array to ensure all properties are in the correct format
    const sanitizedMeals = dietDay.meals.map(meal => {
      if (!meal) return null;
      
      // Ensure meal has required properties
      const sanitizedMeal: Meal = {
        time: meal.time || '',
        name: meal.name || '',
        items: []
      };
      
      // Sanitize meal items
      if (Array.isArray(meal.items)) {
        sanitizedMeal.items = meal.items.map(item => {
          if (!item) return null;
          
          // Create a sanitized meal item with all required properties
          return {
            name: item.name || '',
            completed: !!item.completed,
            calories: Number(item.calories) || 0,
            protein: Number(item.protein) || 0,
            carbs: Number(item.carbs) || 0,
            fats: Number(item.fats) || 0
          } as MealItem;
        }).filter((item): item is MealItem => item !== null); // Remove null items and clarify type
      }
      
      return sanitizedMeal;
    }).filter((meal): meal is Meal => meal !== null); // Remove null meals and clarify type

    // Create a sanitized copy of the diet day to ensure it's safe for Supabase
    const sanitizedDietDay = {
      id: dietDay.id || uuidv4(),
      user_id: dietDay.user_id,
      date: dietDay.date,
      meals: sanitizedMeals,
      completed: !!dietDay.completed
    };

    // Log the data being sent to Supabase for debugging
    console.log('Saving diet day to Supabase:', {
      id: sanitizedDietDay.id,
      user_id: sanitizedDietDay.user_id,
      date: sanitizedDietDay.date,
      meals: `${sanitizedDietDay.meals.length} meals`,
      completed: sanitizedDietDay.completed
    });

    try {
      // Check Supabase connection before proceeding
      console.log('Testing Supabase connection before diet day save...');
      const { connected, details, error: connectionError } = await checkSupabaseConnection();
      
      if (!connected) {
        const errorMsg = `Failed to connect to Supabase: ${details || 'Unknown error'}`;
        console.error(errorMsg, connectionError);
        statusCallbacks?.onError?.(createDetailedError(errorMsg, connectionError));
        return false;
      }
      
      console.log('Supabase connection successful, proceeding with diet day save');
      
      // Try to do the upsert
      const response = await supabase
        .from('diet_history')
        .upsert(sanitizedDietDay, { 
          onConflict: 'date,user_id',
          ignoreDuplicates: false
        });
      
      // Check if response is undefined or null
      if (!response) {
        const errorMsg = 'No response received from Supabase';
        console.error(errorMsg);
        statusCallbacks?.onError?.(createDetailedError(errorMsg));
        return false;
      }
      
      // Destructure after verifying response exists
      const { error, status, statusText, data } = response;
      
      // Log full response for debugging
      console.log('Supabase response:', {
        status,
        statusText,
        hasData: !!data,
        hasError: !!error,
        errorDetails: error ? JSON.stringify(error) : 'none'
      });
      
      if (error) {
        const detailedError = handleSupabaseError('Saving diet day', error);
        console.error('Error saving diet day:', detailedError);
        statusCallbacks?.onError?.(detailedError);
        return false;
      }
    } catch (supabaseError) {
      // Enhanced error logging for exception cases
      console.error('Exception during Supabase diet day save. Error type:', typeof supabaseError);
      
      if (supabaseError === null || supabaseError === undefined) {
        console.error('Caught null or undefined error in saveDietDay');
        statusCallbacks?.onError?.(createDetailedError('Unknown error occurred while saving diet day - received null/undefined error'));
        return false;
      }
      
      // Log raw error object for debugging
      try {
        console.error('Raw error object:', JSON.stringify(supabaseError));
      } catch (jsonError) {
        console.error('Error is not JSON serializable:', supabaseError);
      }
      
      const detailedError = handleSupabaseError('Saving diet day', supabaseError);
      console.error('Exception during Supabase diet day save:', detailedError);
      statusCallbacks?.onError?.(detailedError);
      return false;
    }
    
    // Notify success
    statusCallbacks?.onSuccess?.();
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error saving diet day';
    const detailedError = createDetailedError(errorMessage, error);
    console.error('Error saving diet day:', detailedError);
    statusCallbacks?.onError?.(detailedError);
    return false;
  }
}

// Macro History
export async function getMacroHistory(limit?: number): Promise<DailyMacros[]> {
  // Check if table exists first
  if (!await tableExists('macro_history')) {
    console.warn('macro_history table does not exist');
    return [];
  }

  let query = supabase
    .from('macro_history')
    .select('*')
    .order('date', { ascending: false });
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching macro history:', error);
    return [];
  }
  
  return data || [];
}

export async function getMacrosForDate(date: string): Promise<DailyMacros | null> {
  // Check if table exists first
  if (!await tableExists('macro_history')) {
    console.warn('macro_history table does not exist');
    return null;
  }

  const { data, error } = await supabase
    .from('macro_history')
    .select('*')
    .eq('date', date)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching macros for date ${date}:`, error);
    return null;
  }
  
  return data || null;
}

// Helper function to create a detailed error object
function createDetailedError(message: string, originalError?: any): Error {
  const detailedError = new Error(message);
  
  // Add timestamp to the error
  (detailedError as any).timestamp = getLocalDateString(new Date());
  
  if (originalError) {
    (detailedError as any).originalError = originalError;
    
    // If the original error has a code, add it to the error
    if (originalError.code) {
      (detailedError as any).code = originalError.code;
    }
    
    // If the original error has a name, add it to the error
    if (originalError.name) {
      (detailedError as any).errorType = originalError.name;
    }
    
    // If the original error has details, add them to the error
    if (originalError.details) {
      (detailedError as any).details = originalError.details;
    }
  }
  
  return detailedError;
}

// Helper function to handle Supabase errors
function handleSupabaseError(operation: string, error: any): Error {
  if (!error) {
    console.warn(`Empty error object received during ${operation}`);
    return createDetailedError(`Empty error object received during ${operation}. Check Supabase configuration and network connectivity.`);
  }
  
  if (typeof error === 'string') {
    return createDetailedError(`${operation} failed: ${error}`);
  }
  
  if (error instanceof Error) {
    return createDetailedError(`${operation} failed: ${error.message}`, error);
  }
  
  // Handle Supabase error object
  if (error.code || error.message || error.details) {
    const errorMessage = `${operation} failed: ${error.message || 'Unknown error'} (Code: ${error.code || 'unknown'})`;
    
    // Log detailed error information
    console.error(`Supabase error in ${operation}:`, {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      status: error.status,
      fullError: JSON.stringify(error, null, 2)
    });
    
    // Check for specific error types
    if (error.code === '42P01' || (error.message && error.message.includes('relation') && error.message.includes('does not exist'))) {
      return createDetailedError(`Table does not exist. Please run the database setup script.`, error);
    }
    
    if (error.code === '23505') {
      return createDetailedError(`Duplicate entry. A record with the same unique key already exists.`, error);
    }
    
    if (error.code === '23503') {
      return createDetailedError(`Foreign key violation. Referenced record does not exist.`, error);
    }
    
    if (error.code === '28000' || error.code === '28P01') {
      return createDetailedError(`Authentication failed. Check your Supabase credentials.`, error);
    }
    
    // Return the general error with all available details
    return createDetailedError(errorMessage, error);
  }
  
  // Handle case when error is an empty object
  if (typeof error === 'object' && Object.keys(error).length === 0) {
    console.error(`Received empty object error during ${operation}. This could indicate a network issue or CORS problem.`);
    
    // Check if we can access the Supabase URL for additional diagnostics
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      console.log(`Supabase URL configured as: ${supabaseUrl}`);
    } else {
      console.error('Supabase URL environment variable is not set!');
    }
    
    return createDetailedError(`Connection error during ${operation}. This may be due to network issues, CORS restrictions, or invalid Supabase configuration.`);
  }
  
  // For any other type of error object, try to extract as much information as possible
  const errorMessage = `${operation} failed with unexpected error type: ${typeof error}`;
  
  try {
    const serializedError = JSON.stringify(error);
    console.error(`Unexpected error in ${operation}:`, serializedError);
    return createDetailedError(`${errorMessage}. Details: ${serializedError.substring(0, 100)}...`, error);
  } catch (jsonError) {
    console.error(`Error during JSON serialization of error in ${operation}:`, jsonError);
    return createDetailedError(errorMessage, error);
  }
}

// Update the saveMacros function
export async function saveMacros(
  macros: DailyMacros,
  statusCallbacks?: SaveStatusCallback
): Promise<boolean> {
  try {
    // Notify saving
    statusCallbacks?.onSaving?.();
    
    // Validate input
    if (!macros) {
      const errorMsg = 'No macros data provided';
      console.error(errorMsg);
      statusCallbacks?.onError?.(createDetailedError(errorMsg));
      return false;
    }
    
    // Check Supabase connection first
    const connectionStatus = await checkSupabaseConnection();
    if (!connectionStatus.connected) {
      console.error('Cannot save macros: Supabase connection failed');
      statusCallbacks?.onError?.(connectionStatus.error || createDetailedError('Supabase connection failed'));
      return false;
    }
    
    // Check if table exists
    if (!await tableExists('macro_history')) {
      const errorMsg = 'Macro history table does not exist';
      console.warn(errorMsg);
      statusCallbacks?.onError?.(createDetailedError(errorMsg));
      return false;
    }

    // Validate the date format
    if (!macros.date || !/^\d{4}-\d{2}-\d{2}$/.test(macros.date)) {
      const errorMsg = `Invalid date format: ${macros.date}. Expected YYYY-MM-DD`;
      console.error(errorMsg);
      statusCallbacks?.onError?.(createDetailedError(errorMsg));
      return false;
    }

    // Add user_id if not present
    if (!macros.user_id) {
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          macros.user_id = userId;
          console.log('Using authenticated user ID for macros:', userId);
        } else {
          // Check if we're in a browser environment
          if (typeof window !== 'undefined') {
            // Use a fallback user ID from localStorage if available
            const fallbackUserId = localStorage.getItem('fallbackUserId');
            
            if (fallbackUserId) {
              macros.user_id = fallbackUserId;
              console.log('Using fallback user ID for macros:', fallbackUserId);
            } else {
              // Generate a new fallback user ID and store it
              const newFallbackId = crypto.randomUUID ? crypto.randomUUID() : uuidv4();
              localStorage.setItem('fallbackUserId', newFallbackId);
              macros.user_id = newFallbackId;
              console.log('Created new fallback user ID for macros:', newFallbackId);
            }
          } else {
            // We're on the server side, use a temporary ID
            macros.user_id = uuidv4();
            console.log('Using temporary user ID for macros on server side');
          }
        }
      } catch (userIdError) {
        console.error('Error getting user ID for macros:', userIdError);
        // Continue with a fallback ID
        macros.user_id = uuidv4();
        console.log('Using generated user ID after error:', macros.user_id);
      }
    }

    // Check if all macro values are zero - if so, don't save
    const totalMacros = (Number(macros.calories) || 0) + 
                        (Number(macros.protein) || 0) + 
                        (Number(macros.carbs) || 0) + 
                        (Number(macros.fats) || 0);
                        
    if (totalMacros === 0) {
      console.log('Skipping macros save - all values are zero');
      statusCallbacks?.onSuccess?.();
      return true;
    }

    // Ensure all numeric values are properly rounded integers
    const sanitizedMacros = {
      ...macros,
      id: macros.id || uuidv4(),
      user_id: macros.user_id,
      date: macros.date,
      calories: Math.round(Number(macros.calories) || 0),
      protein: Math.round(Number(macros.protein) || 0),
      carbs: Math.round(Number(macros.carbs) || 0),
      fats: Math.round(Number(macros.fats) || 0)
    };

    // Log the data being sent to Supabase for debugging
    console.log('Saving macros to Supabase:', {
      id: sanitizedMacros.id,
      user_id: sanitizedMacros.user_id,
      date: sanitizedMacros.date,
      calories: sanitizedMacros.calories,
      protein: sanitizedMacros.protein,
      carbs: sanitizedMacros.carbs,
      fats: sanitizedMacros.fats
    });

    try {
      // Verify Supabase connection before attempting to save
      const { data: connectionTest, error: connectionError } = await supabase.from('macro_history').select('count').limit(1);
      
      if (connectionError) {
        const detailedError = handleSupabaseError('Testing Supabase connection', connectionError);
        console.error('Supabase connection error:', detailedError);
        console.error('Connection error details:', JSON.stringify(connectionError));
        statusCallbacks?.onError?.(detailedError);
        return false;
      }
      
      // Proceed with the upsert operation
      const { data, error } = await supabase
        .from('macro_history')
        .upsert(sanitizedMacros, { 
          onConflict: 'date,user_id',
          ignoreDuplicates: false
        });
      
      if (error) {
        const detailedError = handleSupabaseError('Saving macros', error);
        console.error('Error saving macros to Supabase:', detailedError);
        console.error('Error details:', JSON.stringify(error, null, 2));
        statusCallbacks?.onError?.(detailedError);
        return false;
      }
      
      console.log('Successfully saved macros to Supabase', data);
      // Notify success
      statusCallbacks?.onSuccess?.();
      return true;
    } catch (supabaseError) {
      const detailedError = handleSupabaseError('Saving macros', supabaseError);
      console.error('Exception during Supabase macros save:', detailedError);
      console.error('Supabase error details:', supabaseError instanceof Error 
        ? { message: supabaseError.message, stack: supabaseError.stack } 
        : JSON.stringify(supabaseError, null, 2));
      statusCallbacks?.onError?.(detailedError);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error saving macros';
    const detailedError = createDetailedError(errorMessage, error);
    console.error('Error in saveMacros function:', errorMessage);
    console.error('Error details:', error instanceof Error 
      ? { message: error.message, stack: error.stack } 
      : JSON.stringify(error, null, 2));
    statusCallbacks?.onError?.(detailedError);
    return false;
  }
} 