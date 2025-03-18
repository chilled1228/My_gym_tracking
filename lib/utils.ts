import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, addDays, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if localStorage is available in the current environment
 * @returns boolean indicating if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Safely gets an item from localStorage
 * @param key The key to retrieve from localStorage
 * @param defaultValue Default value to return if item doesn't exist or localStorage is unavailable
 * @returns The stored value or defaultValue
 */
export function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    if (!isLocalStorageAvailable()) return defaultValue;
    
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Error getting item ${key} from localStorage:`, e);
    return defaultValue;
  }
}

/**
 * Safely sets an item in localStorage with improved error handling and data validation
 * @param key The key to set in localStorage
 * @param value The value to store
 * @param options Optional configuration for data handling
 * @returns boolean indicating if the operation was successful
 */
export function safeSetItem<T>(
  key: string, 
  value: T, 
  options?: { 
    maxItems?: number;           // Maximum number of items to keep (for array data)
    maxAge?: number;             // Maximum age of items in days (for dated data)
    replaceExisting?: boolean;   // Whether to replace existing data entirely
    validateFn?: (item: any) => boolean; // Function to validate each item
  }
): boolean {
  try {
    if (!isLocalStorageAvailable()) return false;
    
    // Handle array data with cleanup options
    if (Array.isArray(value) && options) {
      let dataToSave = [...value];
      
      // Apply validation if provided
      if (options.validateFn) {
        dataToSave = dataToSave.filter(item => options.validateFn!(item));
      }
      
      // Apply max age filter if provided
      if (options.maxAge && options.maxAge > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - options.maxAge);
        
        dataToSave = dataToSave.filter(item => {
          // Skip items without date property
          if (!item || !item.date) return true;
          
          try {
            const itemDate = new Date(item.date);
            return itemDate >= cutoffDate;
          } catch (e) {
            console.warn(`Invalid date format in item: ${JSON.stringify(item)}`);
            return false;
          }
        });
      }
      
      // Apply max items limit if provided
      if (options.maxItems && options.maxItems > 0 && dataToSave.length > options.maxItems) {
        // Sort by date if items have date property (newest first)
        if (dataToSave[0] && dataToSave[0].date) {
          dataToSave.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        
        // Keep only the specified number of items
        dataToSave = dataToSave.slice(0, options.maxItems);
      }
      
      // Save the cleaned up data
      localStorage.setItem(key, JSON.stringify(dataToSave));
    } else {
      // For non-array data or when no options provided
      localStorage.setItem(key, JSON.stringify(value));
    }
    
    return true;
  } catch (e) {
    console.error(`Error setting item ${key} in localStorage:`, e);
    return false;
  }
}

/**
 * Validates and processes imported plan data
 * @param data The imported JSON data
 * @returns Object containing validated workout and diet plans
 */
export function validateImportedPlans(data: any): { 
  workoutPlans?: any[], 
  dietPlans?: any[],
  isValid: boolean,
  message: string 
} {
  try {
    // Initialize result
    const result = {
      workoutPlans: undefined as any[] | undefined,
      dietPlans: undefined as any[] | undefined,
      isValid: false,
      message: ""
    };
    
    // Check if data is valid
    if (!data) {
      return {
        ...result,
        message: "Invalid import format. Please provide valid JSON data."
      };
    }
    
    // Handle array input - could be an array of workout plans or diet plans
    if (Array.isArray(data)) {
      // Try to determine if this is a workout or diet plan array
      if (data.length === 0) {
        return {
          ...result,
          message: "Empty array provided. Please provide at least one plan."
        };
      }
      
      // Check first item to determine type
      const firstItem = data[0];
      
      // Check if it looks like a workout plan
      if (firstItem.days && Array.isArray(firstItem.days)) {
        // Validate as workout plans
        for (const plan of data) {
          if (!plan.id || !plan.name || !plan.description || !Array.isArray(plan.days)) {
            return {
              ...result,
              message: "Invalid workout plan structure. Each plan must have id, name, description, and days array."
            };
          }
        }
        
        result.workoutPlans = data;
        return {
          ...result,
          isValid: true,
          message: "Workout plans imported successfully."
        };
      }
      
      // Check if it looks like a diet plan (with either meals or foodItems)
      if ((firstItem.meals && Array.isArray(firstItem.meals)) || 
          (firstItem.meals && Array.isArray(firstItem.meals) && firstItem.meals.some((m: any) => m.meal || m.foodItems))) {
        // Normalize diet plans to the expected format
        const normalizedDietPlans = data.map(plan => {
          // Create a copy of the plan to avoid mutating the original
          const normalizedPlan = { ...plan };
          
          // Ensure meals array exists
          if (!normalizedPlan.meals || !Array.isArray(normalizedPlan.meals)) {
            normalizedPlan.meals = [];
          }
          
          // Normalize each meal
          normalizedPlan.meals = normalizedPlan.meals.map((meal: any) => {
            const normalizedMeal = { ...meal };
            
            // Convert 'meal' property to 'name' if needed
            if (normalizedMeal.meal && !normalizedMeal.name) {
              normalizedMeal.name = normalizedMeal.meal;
              delete normalizedMeal.meal;
            }
            
            // Ensure items array exists
            if (!normalizedMeal.items) {
              normalizedMeal.items = [];
              
              // Convert foodItems to items if needed
              if (normalizedMeal.foodItems && Array.isArray(normalizedMeal.foodItems)) {
                normalizedMeal.items = normalizedMeal.foodItems.map((item: any) => {
                  // If foodItem is a string, convert to object
                  if (typeof item === 'string') {
                    return {
                      name: item,
                      completed: false,
                      calories: 0,
                      protein: 0,
                      carbs: 0,
                      fats: 0
                    };
                  }
                  return item;
                });
                delete normalizedMeal.foodItems;
              }
            }
            
            return normalizedMeal;
          });
          
          return normalizedPlan;
        });
        
        // Basic validation of diet plan structure
        for (const plan of normalizedDietPlans) {
          if (!plan.id || !plan.name || !plan.description || !Array.isArray(plan.meals)) {
            return {
              ...result,
              message: "Invalid diet plan structure. Each plan must have id, name, description, and meals array."
            };
          }
        }
        
        result.dietPlans = normalizedDietPlans;
        return {
          ...result,
          isValid: true,
          message: "Diet plans imported successfully."
        };
      }
      
      // If we can't determine the type
      return {
        ...result,
        message: "Unable to determine plan type. Please ensure your data follows the correct format."
      };
    }
    
    // Handle object input with workoutPlans and/or dietPlans properties
    if (typeof data === 'object') {
      // Validate workout plans if present
      if (data.workoutPlans) {
        if (!Array.isArray(data.workoutPlans)) {
          return {
            ...result,
            message: "Workout plans must be an array."
          };
        }
        
        if (data.workoutPlans.length === 0) {
          // Empty array is fine, just don't include it
        } else {
          // Basic validation of workout plan structure
          for (const plan of data.workoutPlans) {
            if (!plan.id || !plan.name || !plan.description || !Array.isArray(plan.days)) {
              return {
                ...result,
                message: "Invalid workout plan structure. Each plan must have id, name, description, and days array."
              };
            }
          }
          
          result.workoutPlans = data.workoutPlans;
        }
      }
      
      // Validate diet plans if present
      if (data.dietPlans) {
        if (!Array.isArray(data.dietPlans)) {
          return {
            ...result,
            message: "Diet plans must be an array."
          };
        }
        
        if (data.dietPlans.length === 0) {
          // Empty array is fine, just don't include it
        } else {
          // Normalize diet plans to the expected format
          const normalizedDietPlans = data.dietPlans.map((plan: any) => {
            // Create a copy of the plan to avoid mutating the original
            const normalizedPlan = { ...plan };
            
            // Ensure meals array exists
            if (!normalizedPlan.meals || !Array.isArray(normalizedPlan.meals)) {
              normalizedPlan.meals = [];
            }
            
            // Normalize each meal
            normalizedPlan.meals = normalizedPlan.meals.map((meal: any) => {
              const normalizedMeal = { ...meal };
              
              // Convert 'meal' property to 'name' if needed
              if (normalizedMeal.meal && !normalizedMeal.name) {
                normalizedMeal.name = normalizedMeal.meal;
                delete normalizedMeal.meal;
              }
              
              // Ensure items array exists
              if (!normalizedMeal.items) {
                normalizedMeal.items = [];
                
                // Convert foodItems to items if needed
                if (normalizedMeal.foodItems && Array.isArray(normalizedMeal.foodItems)) {
                  normalizedMeal.items = normalizedMeal.foodItems.map((item: any) => {
                    // If foodItem is a string, convert to object
                    if (typeof item === 'string') {
                      return {
                        name: item,
                        completed: false,
                        calories: 0,
                        protein: 0,
                        carbs: 0,
                        fats: 0
                      };
                    }
                    return item;
                  });
                  delete normalizedMeal.foodItems;
                }
              }
              
              return normalizedMeal;
            });
            
            return normalizedPlan;
          });
          
          // Basic validation of diet plan structure
          for (const plan of normalizedDietPlans) {
            if (!plan.id || !plan.name || !plan.description || !Array.isArray(plan.meals)) {
              return {
                ...result,
                message: "Invalid diet plan structure. Each plan must have id, name, description, and meals array."
              };
            }
          }
          
          result.dietPlans = normalizedDietPlans;
        }
      }
      
      // Check if we found any valid plans
      if (!result.workoutPlans && !result.dietPlans) {
        // Try to determine if this is a single plan object
        if (data.days && Array.isArray(data.days)) {
          // Looks like a single workout plan
          if (!data.id || !data.name || !data.description) {
            return {
              ...result,
              message: "Invalid workout plan structure. Plan must have id, name, description, and days array."
            };
          }
          
          result.workoutPlans = [data];
          return {
            ...result,
            isValid: true,
            message: "Single workout plan imported successfully."
          };
        }
        
        // Check if it looks like a diet plan (with either meals or foodItems)
        if ((data.meals && Array.isArray(data.meals)) || 
            (data.meals && Array.isArray(data.meals) && data.meals.some((m: any) => m.meal || m.foodItems))) {
          // Looks like a single diet plan
          if (!data.id || !data.name || !data.description) {
            return {
              ...result,
              message: "Invalid diet plan structure. Plan must have id, name, description, and meals array."
            };
          }
          
          // Normalize the diet plan
          const normalizedPlan = { ...data };
          
          // Normalize each meal
          normalizedPlan.meals = normalizedPlan.meals.map((meal: any) => {
            const normalizedMeal = { ...meal };
            
            // Convert 'meal' property to 'name' if needed
            if (normalizedMeal.meal && !normalizedMeal.name) {
              normalizedMeal.name = normalizedMeal.meal;
              delete normalizedMeal.meal;
            }
            
            // Ensure items array exists
            if (!normalizedMeal.items) {
              normalizedMeal.items = [];
              
              // Convert foodItems to items if needed
              if (normalizedMeal.foodItems && Array.isArray(normalizedMeal.foodItems)) {
                normalizedMeal.items = normalizedMeal.foodItems.map((item: any) => {
                  // If foodItem is a string, convert to object
                  if (typeof item === 'string') {
                    return {
                      name: item,
                      completed: false,
                      calories: 0,
                      protein: 0,
                      carbs: 0,
                      fats: 0
                    };
                  }
                  return item;
                });
                delete normalizedMeal.foodItems;
              }
            }
            
            return normalizedMeal;
          });
          
          result.dietPlans = [normalizedPlan];
          return {
            ...result,
            isValid: true,
            message: "Single diet plan imported successfully."
          };
        }
        
        return {
          ...result,
          message: "No valid workout or diet plans found in the imported data."
        };
      }
      
      return {
        ...result,
        isValid: true,
        message: "Import successful."
      };
    }
    
    return {
      ...result,
      message: "Invalid import format. Please provide a valid JSON object or array."
    };
  } catch (error) {
    return {
      workoutPlans: undefined,
      dietPlans: undefined,
      isValid: false,
      message: `Error processing import: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Exports diet plans to a JSON file
 * @param dietPlans Array of diet plans to export
 * @returns A JSON string containing the exported plans
 */
export function exportPlansToJson(workoutPlans?: any[], dietPlans?: any[]): string {
  const exportData = {
    ...(dietPlans && dietPlans.length > 0 ? { dietPlans } : {})
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * Triggers a download of a JSON file
 * @param filename The name of the file to download
 * @param jsonContent The JSON content to download
 */
export function downloadJson(filename: string, jsonContent: string): void {
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Safely copies text to clipboard with fallback for browsers that don't support the Clipboard API
 * @param text The text to copy to clipboard
 * @returns A promise that resolves to a boolean indicating success
 */
export async function safeCopyToClipboard(text: string): Promise<boolean> {
  try {
    // Try using the Clipboard API first
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback method using document.execCommand
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea out of viewport
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    // Select and copy
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return success;
  } catch (error) {
    console.error('Failed to copy text: ', error);
    return false;
  }
}

/**
 * A function to generate a consistent date string regardless of timezone or device
 * Uses the client's local timezone settings for reliable date representation
 * @param date Date object to convert to string (defaults to current date)
 * @returns String in YYYY-MM-DD format representing the date in the user's local timezone
 */
export function getLocalDateString(date: Date = new Date()): string {
  try {
    // Extract year, month, and day in user's local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Return YYYY-MM-DD format
    return `${year}-${month}-${day}`;
  } catch (error) {
    // Fallback in case of any issues with the Date object
    console.error("Error formatting date:", error);
    // Return today's date as fallback using traditional method but with local timezone offset
    const fallbackDate = new Date();
    const tzOffset = fallbackDate.getTimezoneOffset() * 60000; // offset in milliseconds
    const localDate = new Date(fallbackDate.getTime() - tzOffset);
    return localDate.toISOString().split('T')[0];
  }
}

/**
 * Function to get today's date in user's local timezone as YYYY-MM-DD
 * Ensures consistent representation of "today" across different devices and browsers
 * @returns Today's date as a string in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return getLocalDateString(new Date());
}

/**
 * Creates a Date object from a YYYY-MM-DD string, preserving the local timezone
 * This ensures that dates are interpreted consistently across devices
 * @param dateString Date string in YYYY-MM-DD format
 * @returns Date object representing the date in the local timezone
 */
export function dateFromLocalString(dateString: string): Date {
  try {
    // Parse the YYYY-MM-DD format into year, month, day components
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Create a new date with components and local timezone
    // Note: month is 0-indexed in JavaScript Date
    const date = new Date(year, month - 1, day);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date string: ${dateString}`);
    }
    
    return date;
  } catch (error) {
    console.error(`Error parsing date string "${dateString}":`, error);
    // Return current date as fallback
    return new Date();
  }
}
