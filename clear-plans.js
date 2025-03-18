// Function to clear all plan-related data from localStorage
function clearAllPlans() {
  try {
    console.log("Starting to clear all plan-related data from localStorage...");
    
    // Define all keys to clear in a structured way
    const keysToRemove = [
      // Workout-related data
      "customWorkoutPlans",
      "currentWorkoutPlanId",
      "workoutHistory",
      "workoutProgress",
      
      // Diet-related data
      "customDietPlans",
      "currentDietPlanId",
      "dietHistory",
      "macroHistory",
      "currentDietDay",
      
      // Consistency check data
      "planConsistencyAttempts"
    ];
    
    // Clear each key with proper error handling
    let clearSuccess = true;
    const clearErrors = [];
    const clearedKeys = [];
    
    keysToRemove.forEach(key => {
      try {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          clearedKeys.push(key);
          console.log(`Successfully removed ${key} from localStorage`);
        } else {
          console.log(`Key ${key} not found in localStorage`);
        }
      } catch (e) {
        clearSuccess = false;
        clearErrors.push(`Failed to remove ${key}: ${e}`);
        console.error(`Error removing ${key} from localStorage:`, e);
      }
    });
    
    // Log results
    if (clearSuccess) {
      console.log("Successfully cleared all plan-related data");
      console.log("Cleared keys:", clearedKeys);
    } else {
      console.error("Some errors occurred while clearing data:", clearErrors);
      console.log("Cleared keys:", clearedKeys);
    }
    
    // If targeted approach fails, try clearing all localStorage
    if (!clearSuccess) {
      try {
        console.warn("Targeted reset had errors, clearing all localStorage...");
        localStorage.clear();
        console.log("Successfully cleared all localStorage");
      } catch (e) {
        console.error("Complete localStorage clear failed:", e);
      }
    }
    
    return {
      success: clearSuccess,
      clearedKeys,
      errors: clearErrors
    };
  } catch (error) {
    console.error("Error during plan clearing:", error);
    
    // Last resort: try clearing all localStorage
    try {
      console.warn("Plan clearing failed, attempting full localStorage clear...");
      localStorage.clear();
      console.log("Successfully cleared all localStorage");
      return { success: true, fullClear: true };
    } catch (e) {
      console.error("Complete localStorage clear failed:", e);
      return { success: false, error: e.message };
    }
  }
}

// Function to clear only diet-related data
function clearDietPlans() {
  try {
    console.log("Starting to clear diet-related data from localStorage...");
    
    const keysToRemove = [
      "customDietPlans",
      "currentDietPlanId",
      "dietHistory",
      "macroHistory",
      "currentDietDay"
    ];
    
    let clearSuccess = true;
    const clearErrors = [];
    const clearedKeys = [];
    
    keysToRemove.forEach(key => {
      try {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          clearedKeys.push(key);
          console.log(`Successfully removed ${key} from localStorage`);
        } else {
          console.log(`Key ${key} not found in localStorage`);
        }
      } catch (e) {
        clearSuccess = false;
        clearErrors.push(`Failed to remove ${key}: ${e}`);
        console.error(`Error removing ${key} from localStorage:`, e);
      }
    });
    
    if (clearSuccess) {
      console.log("Successfully cleared all diet-related data");
      console.log("Cleared keys:", clearedKeys);
    } else {
      console.error("Some errors occurred while clearing diet data:", clearErrors);
      console.log("Cleared keys:", clearedKeys);
    }
    
    return {
      success: clearSuccess,
      clearedKeys,
      errors: clearErrors
    };
  } catch (error) {
    console.error("Error during diet plan clearing:", error);
    return { success: false, error: error.message };
  }
}

// Execute the function to clear all plans
const result = clearAllPlans();
console.log("Clear operation result:", result);

// Reload the page after a short delay to ensure changes take effect
setTimeout(() => {
  console.log("Reloading page to apply changes...");
  window.location.reload();
}, 1000); 