"use client"

import { useState, useEffect } from "react"
import { workoutPlans, dietPlans, WorkoutPlan, DietPlan } from "@/lib/plan-templates"
import { safeGetItem, safeSetItem } from "@/lib/utils"

interface UsePlanManagerReturn {
  // Workout plan management
  currentWorkoutPlanId: string
  currentWorkoutPlan: WorkoutPlan
  availableWorkoutPlans: WorkoutPlan[]
  changeWorkoutPlan: (planId: string) => void
  
  // Diet plan management
  currentDietPlanId: string
  currentDietPlan: DietPlan
  availableDietPlans: DietPlan[]
  changeDietPlan: (planId: string) => void
  
  // Import functionality
  importPlans: (importedWorkoutPlans?: WorkoutPlan[], importedDietPlans?: DietPlan[]) => void
  
  // Delete functionality
  deleteAllDietPlans: (skipResetToDefault?: boolean) => void
  deleteAllWorkoutPlans: (skipResetToDefault?: boolean) => void
  
  // Reload functionality
  forceReloadPlans: () => void
  
  // Consistency check functionality
  checkPlanDisplayConsistency: () => void
  
  // Emergency reset functionality
  emergencyResetAndReload: () => void
}

// Utility function to validate and normalize a diet plan
function validateAndNormalizeDietPlan(plan: any): DietPlan | null {
  try {
    // Create a deep copy of the plan
    const planCopy = JSON.parse(JSON.stringify(plan))
    
    // Ensure the plan has meals array
    if (!planCopy.meals) {
      planCopy.meals = []
    }
    
    // Ensure each meal has the required properties
    planCopy.meals = planCopy.meals.map((meal: any) => {
      // Convert 'meal' property to 'name' if needed
      if (meal.meal && !meal.name) {
        meal.name = meal.meal
        delete meal.meal
      }
      
      // Ensure meal has items array
      if (!meal.items) {
        meal.items = []
        
        // Convert foodItems to items if needed
        if (meal.foodItems && Array.isArray(meal.foodItems)) {
          meal.items = meal.foodItems.map((item: any) => {
            // If foodItem is a string, convert to object
            if (typeof item === 'string') {
              return {
                name: item,
                completed: false,
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: 0
              }
            }
            return {
              name: item.name || "Unknown item",
              completed: item.completed || false,
              calories: item.calories || 0,
              protein: item.protein || 0,
              carbs: item.carbs || 0,
              fats: item.fats || 0
            }
          })
          delete meal.foodItems
        }
      } else {
        // Ensure each meal item has the required properties
        meal.items = meal.items.map((item: any) => {
          return {
            name: item.name || "Unknown item",
            completed: item.completed || false,
            calories: item.calories || 0,
            protein: item.protein || 0,
            carbs: item.carbs || 0,
            fats: item.fats || 0
          }
        })
      }
      
      // Ensure meal has all required properties
      return {
        time: meal.time || "",
        name: meal.name || "",
        items: meal.items,
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fats: meal.fats || 0
      }
    })
    
    // Ensure plan has all required properties
    return {
      id: planCopy.id || "",
      name: planCopy.name || "",
      description: planCopy.description || "",
      targetCalories: planCopy.targetCalories || 0,
      targetProtein: planCopy.targetProtein || 0,
      targetCarbs: planCopy.targetCarbs || 0,
      targetFats: planCopy.targetFats || 0,
      meals: planCopy.meals
    }
  } catch (error) {
    console.error("Error validating diet plan:", error)
    return null
  }
}

// Utility function to validate and normalize a workout plan
function validateAndNormalizeWorkoutPlan(plan: any): WorkoutPlan | null {
  try {
    // Create a deep copy of the plan
    const planCopy = JSON.parse(JSON.stringify(plan))
    
    // Ensure the plan has days array
    if (!planCopy.days) {
      planCopy.days = []
    }
    
    // Ensure each day has the required properties
    planCopy.days = planCopy.days.map((day: any, index: number) => {
      // Ensure day has a name
      if (!day.name) {
        day.name = `Day ${index + 1}`
      }
      
      // Ensure day has exercises array
      if (!day.exercises) {
        day.exercises = []
      }
      
      // Ensure each exercise has the required properties
      day.exercises = day.exercises.map((exercise: any, exIndex: number) => {
        return {
          name: exercise.name || `Exercise ${exIndex + 1}`,
          sets: exercise.sets || 0,
          reps: exercise.reps || 0,
          weight: exercise.weight || 0,
          notes: exercise.notes || "",
          completed: exercise.completed || false
        }
      })
      
      return {
        name: day.name,
        exercises: day.exercises
      }
    })
    
    // Ensure plan has all required properties
    return {
      id: planCopy.id || "",
      name: planCopy.name || "",
      description: planCopy.description || "",
      days: planCopy.days
    }
  } catch (error) {
    console.error("Error validating workout plan:", error)
    return null
  }
}

export function usePlanManager(): UsePlanManagerReturn {
  // Workout plan state
  const [currentWorkoutPlanId, setCurrentWorkoutPlanId] = useState<string>("default")
  const [currentWorkoutPlan, setCurrentWorkoutPlan] = useState<WorkoutPlan>(workoutPlans[0])
  const [availableWorkoutPlans, setAvailableWorkoutPlans] = useState<WorkoutPlan[]>([workoutPlans[0]])
  
  // Diet plan state
  const [currentDietPlanId, setCurrentDietPlanId] = useState<string>("default")
  const [currentDietPlan, setCurrentDietPlan] = useState<DietPlan>(dietPlans[0])
  const [availableDietPlans, setAvailableDietPlans] = useState<DietPlan[]>([dietPlans[0]])

  // Function to force reload the current plans from localStorage
  const forceReloadPlans = () => {
    try {
      console.log("Starting force reload of plans...");
      
      // Load custom plans
      const customWorkoutPlans = safeGetItem<WorkoutPlan[]>("customWorkoutPlans", [])
      const customDietPlans = safeGetItem<DietPlan[]>("customDietPlans", [])
      
      // Get current plan IDs from localStorage
      const currentWorkoutPlanIdFromStorage = safeGetItem<string>("currentWorkoutPlanId", "default");
      const currentDietPlanIdFromStorage = safeGetItem<string>("currentDietPlanId", "default");
      
      console.log("Loaded plans from localStorage:", {
        customWorkoutPlans: customWorkoutPlans.length > 0 ? customWorkoutPlans : "None",
        customDietPlans: customDietPlans.length > 0 ? customDietPlans : "None",
        currentWorkoutPlanIdFromStorage,
        currentDietPlanIdFromStorage
      });
      
      // Check if we have a custom workout plan
      if (customWorkoutPlans.length > 0) {
        // Use the custom plan
        const customPlan = customWorkoutPlans[0]
        console.log("Setting custom workout plan:", customPlan);
        setCurrentWorkoutPlanId(customPlan.id)
        setCurrentWorkoutPlan(customPlan)
        setAvailableWorkoutPlans([customPlan])
        console.log("Reloaded custom workout plan:", customPlan.name)
      } else {
        // Check if we should use the default plan or clear the state
        if (currentWorkoutPlanIdFromStorage === "") {
          // Clear the state completely
          console.log("No workout plan ID found, clearing workout plan state");
          setAvailableWorkoutPlans([]);
          setCurrentWorkoutPlanId("");
          setCurrentWorkoutPlan({
            id: "",
            name: "",
            description: "",
            days: []
          });
        } else if (currentWorkoutPlanIdFromStorage === "default") {
          // Use the default plan
          const defaultPlan = workoutPlans[0]
          console.log("Setting default workout plan:", defaultPlan);
          setCurrentWorkoutPlanId(defaultPlan.id)
          setCurrentWorkoutPlan(defaultPlan)
          setAvailableWorkoutPlans([defaultPlan])
          console.log("No custom workout plan found, using default")
        } else {
          // Clear the state if the ID doesn't match any known plan
          console.log("Unknown workout plan ID, clearing workout plan state");
          setAvailableWorkoutPlans([]);
          setCurrentWorkoutPlanId("");
          setCurrentWorkoutPlan({
            id: "",
            name: "",
            description: "",
            days: []
          });
          // Update localStorage to reflect the cleared state
          safeSetItem("currentWorkoutPlanId", "", { replaceExisting: true });
        }
      }
      
      // Check if we have a custom diet plan
      if (customDietPlans.length > 0) {
        // Validate and normalize the custom plan
        const customPlan = customDietPlans[0]
        const normalizedPlan = validateAndNormalizeDietPlan(customPlan)
        
        if (normalizedPlan) {
          // Use the custom plan
          console.log("Setting custom diet plan:", normalizedPlan);
          setCurrentDietPlanId(normalizedPlan.id)
          setCurrentDietPlan(normalizedPlan)
          setAvailableDietPlans([normalizedPlan])
          console.log("Reloaded custom diet plan:", normalizedPlan.name)
        } else {
          // Fallback to default plan if there's an error
          const defaultPlan = dietPlans[0]
          console.log("Setting default diet plan due to validation error:", defaultPlan);
          setCurrentDietPlanId(defaultPlan.id)
          setCurrentDietPlan(defaultPlan)
          setAvailableDietPlans([defaultPlan])
          console.log("Error validating custom diet plan, using default")
        }
      } else {
        // Check if we should use the default plan or clear the state
        if (currentDietPlanIdFromStorage === "") {
          // Clear the state completely
          console.log("No diet plan ID found, clearing diet plan state");
          setAvailableDietPlans([]);
          setCurrentDietPlanId("");
          setCurrentDietPlan({
            id: "",
            name: "",
            description: "",
            targetCalories: 0,
            targetProtein: 0,
            targetCarbs: 0,
            targetFats: 0,
            meals: []
          });
        } else if (currentDietPlanIdFromStorage === "default") {
          // Use the default plan
          const defaultPlan = dietPlans[0]
          console.log("Setting default diet plan:", defaultPlan);
          setCurrentDietPlanId(defaultPlan.id)
          setCurrentDietPlan(defaultPlan)
          setAvailableDietPlans([defaultPlan])
          console.log("No custom diet plan found, using default")
        } else {
          // Clear the state if the ID doesn't match any known plan
          console.log("Unknown diet plan ID, clearing diet plan state");
          setAvailableDietPlans([]);
          setCurrentDietPlanId("");
          setCurrentDietPlan({
            id: "",
            name: "",
            description: "",
            targetCalories: 0,
            targetProtein: 0,
            targetCarbs: 0,
            targetFats: 0,
            meals: []
          });
          // Update localStorage to reflect the cleared state
          safeSetItem("currentDietPlanId", "", { replaceExisting: true });
        }
      }
      
      console.log("Force reload completed. Current state:", {
        currentWorkoutPlanId,
        currentDietPlanId
      });
      
      // Schedule a check to verify the plans are displayed correctly
      setTimeout(() => {
        checkPlanDisplayConsistency();
      }, 200);
    } catch (error) {
      console.error("Error reloading plans:", error)
    }
  }

  // Function to check if the plans are being displayed correctly
  const checkPlanDisplayConsistency = () => {
    try {
      // Use a static counter to track how many times we've tried to fix inconsistencies
      const attemptCount = parseInt(sessionStorage.getItem('planConsistencyAttempts') || '0');
      
      // If we've tried too many times, do an emergency reset
      if (attemptCount > 3) {
        console.error("Too many consistency check attempts, triggering emergency reset...");
        sessionStorage.removeItem('planConsistencyAttempts');
        emergencyResetAndReload();
        return;
      }
      
      console.log("Checking plan display consistency...");
      
      // Check workout plan consistency
      const storedWorkoutPlans = safeGetItem<WorkoutPlan[]>("customWorkoutPlans", []);
      const storedWorkoutPlanId = safeGetItem<string>("currentWorkoutPlanId", "default");
      
      const workoutConsistencyCheck = {
        storedPlansCount: storedWorkoutPlans.length,
        storedPlanId: storedWorkoutPlanId,
        currentPlanId: currentWorkoutPlanId,
        currentPlanName: currentWorkoutPlan.name,
        isConsistent: (
          (storedWorkoutPlans.length === 0 && currentWorkoutPlanId === "default") ||
          (storedWorkoutPlans.length > 0 && currentWorkoutPlanId === storedWorkoutPlanId)
        )
      };
      
      // Check diet plan consistency
      const storedDietPlans = safeGetItem<DietPlan[]>("customDietPlans", []);
      const storedDietPlanId = safeGetItem<string>("currentDietPlanId", "default");
      
      const dietConsistencyCheck = {
        storedPlansCount: storedDietPlans.length,
        storedPlanId: storedDietPlanId,
        currentPlanId: currentDietPlanId,
        currentPlanName: currentDietPlan.name,
        isConsistent: (
          (storedDietPlans.length === 0 && currentDietPlanId === "default") ||
          (storedDietPlans.length > 0 && currentDietPlanId === storedDietPlanId)
        )
      };
      
      console.log("Plan display consistency check:", {
        workout: workoutConsistencyCheck,
        diet: dietConsistencyCheck
      });
      
      // If there's an inconsistency, try to fix it
      if (!workoutConsistencyCheck.isConsistent || !dietConsistencyCheck.isConsistent) {
        // Increment the attempt counter
        sessionStorage.setItem('planConsistencyAttempts', (attemptCount + 1).toString());
        
        if (!workoutConsistencyCheck.isConsistent) {
          console.warn("Workout plan display inconsistency detected, attempting to fix...");
          forceReloadPlans();
        }
        
        if (!dietConsistencyCheck.isConsistent) {
          console.warn("Diet plan display inconsistency detected, attempting to fix...");
          forceReloadPlans();
        }
      } else {
        // Reset the attempt counter if everything is consistent
        sessionStorage.removeItem('planConsistencyAttempts');
        console.log("Plan display consistency check passed.");
      }
    } catch (error) {
      console.error("Error checking plan display consistency:", error);
    }
  }

  // Load saved plan preferences and custom plans on mount
  useEffect(() => {
    // Load saved plan IDs
    const savedWorkoutPlanId = safeGetItem("currentWorkoutPlanId", "default")
    const savedDietPlanId = safeGetItem("currentDietPlanId", "default")
    
    // Load custom plans
    const customWorkoutPlans = safeGetItem<WorkoutPlan[]>("customWorkoutPlans", [])
    const customDietPlans = safeGetItem<DietPlan[]>("customDietPlans", [])
    
    // Check if we have a custom workout plan
    if (customWorkoutPlans.length > 0) {
      // Use the custom plan
      const customPlan = customWorkoutPlans[0]
      setCurrentWorkoutPlanId(customPlan.id)
      setCurrentWorkoutPlan(customPlan)
      setAvailableWorkoutPlans([customPlan])
    } else {
      // Use the default plan
      const defaultPlan = workoutPlans[0]
      setCurrentWorkoutPlanId(defaultPlan.id)
      setCurrentWorkoutPlan(defaultPlan)
      setAvailableWorkoutPlans([defaultPlan])
    }
    
    // Check if we have a custom diet plan
    if (customDietPlans.length > 0) {
      // Validate and normalize the custom plan
      const customPlan = customDietPlans[0]
      const normalizedPlan = validateAndNormalizeDietPlan(customPlan)
      
      if (normalizedPlan) {
        // Use the custom plan
        setCurrentDietPlanId(normalizedPlan.id)
        setCurrentDietPlan(normalizedPlan)
        setAvailableDietPlans([normalizedPlan])
      } else {
        // Fallback to default plan if there's an error
        const defaultPlan = dietPlans[0]
        setCurrentDietPlanId(defaultPlan.id)
        setCurrentDietPlan(defaultPlan)
        setAvailableDietPlans([defaultPlan])
      }
    } else {
      // Use the default plan
      const defaultPlan = dietPlans[0]
      setCurrentDietPlanId(defaultPlan.id)
      setCurrentDietPlan(defaultPlan)
      setAvailableDietPlans([defaultPlan])
    }
    
    // Check plan display consistency after a short delay
    setTimeout(() => {
      checkPlanDisplayConsistency();
    }, 500);
  }, []) // Empty dependency array ensures this only runs once on mount

  // Function to change workout plan - simplified since we only have one plan
  const changeWorkoutPlan = (planId: string) => {
    // This function is kept for API compatibility but doesn't do anything
    // since we only have one plan at a time
    console.log("changeWorkoutPlan called, but only one plan is available")
  }

  // Function to change diet plan - simplified since we only have one plan
  const changeDietPlan = (planId: string) => {
    // This function is kept for API compatibility but doesn't do anything
    // since we only have one plan at a time
    console.log("changeDietPlan called, but only one plan is available")
  }
  
  // Function to import plans
  const importPlans = (importedWorkoutPlans?: WorkoutPlan[], importedDietPlans?: DietPlan[]) => {
    let workoutImported = false;
    let dietImported = false;
    
    console.log("Starting import of plans:", {
      workoutPlans: importedWorkoutPlans ? `${importedWorkoutPlans.length} plans` : "None",
      dietPlans: importedDietPlans ? `${importedDietPlans.length} plans` : "None"
    });
    
    // First, clear all existing plans from localStorage to ensure a clean slate
    if (importedWorkoutPlans && importedWorkoutPlans.length > 0) {
      console.log("Clearing all existing workout plans from localStorage");
      localStorage.removeItem("customWorkoutPlans");
      localStorage.removeItem("currentWorkoutPlanId");
      localStorage.removeItem("workoutHistory");
      localStorage.removeItem("workoutProgress");
    }
    
    if (importedDietPlans && importedDietPlans.length > 0) {
      console.log("Clearing all existing diet plans from localStorage");
      localStorage.removeItem("customDietPlans");
      localStorage.removeItem("currentDietPlanId");
      localStorage.removeItem("dietHistory");
      localStorage.removeItem("macroHistory");
      localStorage.removeItem("currentDietDay");
    }
    
    // Handle workout plans import
    if (importedWorkoutPlans && importedWorkoutPlans.length > 0) {
      // Take only the first imported plan
      const latestPlan = importedWorkoutPlans[0];
      console.log("Processing workout plan:", latestPlan);
      
      // Validate and normalize the plan
      const normalizedPlan = validateAndNormalizeWorkoutPlan(latestPlan);
      
      if (normalizedPlan) {
        console.log("Workout plan validated successfully:", normalizedPlan);
        
        // Add prefix to imported plan ID to avoid conflicts with default plans
        const processedPlan = {
          ...normalizedPlan,
          id: "imported-workout-plan",
          name: normalizedPlan.name || "Imported Workout Plan"
        };
        console.log("Processed workout plan:", processedPlan);
        
        // Save directly to localStorage first
        try {
          localStorage.setItem("customWorkoutPlans", JSON.stringify([processedPlan]));
          localStorage.setItem("currentWorkoutPlanId", processedPlan.id);
          console.log("Directly saved workout plan to localStorage");
        } catch (error) {
          console.error("Error directly saving workout plan:", error);
        }
        
        // Then use safeSetItem as a backup
        const saveResult = safeSetItem("customWorkoutPlans", [processedPlan], {
          validateFn: (item) => {
            return item && 
                   typeof item.id === 'string' && 
                   typeof item.name === 'string' && 
                   Array.isArray(item.days);
          },
          replaceExisting: true
        });
        console.log("Saved workout plan to localStorage:", saveResult);
        
        // Update available plans and current plan
        console.log("Updating workout plan state...");
        setAvailableWorkoutPlans([processedPlan]);
        setCurrentWorkoutPlanId(processedPlan.id);
        setCurrentWorkoutPlan(processedPlan);
        safeSetItem("currentWorkoutPlanId", processedPlan.id, { replaceExisting: true });
        
        console.log("Successfully imported and replaced workout plan");
        workoutImported = true;
      } else {
        console.error("Failed to validate workout plan, import aborted");
      }
    }
    
    // Handle diet plans import
    if (importedDietPlans && importedDietPlans.length > 0) {
      // Take only the first imported plan
      const latestPlan = importedDietPlans[0];
      console.log("Processing diet plan:", latestPlan);
      
      // Validate and normalize the plan
      const normalizedPlan = validateAndNormalizeDietPlan(latestPlan);
      
      if (normalizedPlan) {
        console.log("Diet plan validated successfully:", normalizedPlan);
        
        // Add prefix to imported plan ID to avoid conflicts with default plans
        const processedPlan = {
          ...normalizedPlan,
          id: "imported-diet-plan",
          name: normalizedPlan.name || "Imported Diet Plan"
        };
        console.log("Processed diet plan:", processedPlan);
        
        // Save directly to localStorage first
        try {
          localStorage.setItem("customDietPlans", JSON.stringify([processedPlan]));
          localStorage.setItem("currentDietPlanId", processedPlan.id);
          console.log("Directly saved diet plan to localStorage");
        } catch (error) {
          console.error("Error directly saving diet plan:", error);
        }
        
        // Then use safeSetItem as a backup
        const saveResult = safeSetItem("customDietPlans", [processedPlan], {
          validateFn: (item) => {
            return item && 
                   typeof item.id === 'string' && 
                   typeof item.name === 'string' && 
                   Array.isArray(item.meals);
          },
          replaceExisting: true
        });
        console.log("Saved diet plan to localStorage:", saveResult);
        
        // Update available plans and current plan
        console.log("Updating diet plan state...");
        setAvailableDietPlans([processedPlan]);
        setCurrentDietPlanId(processedPlan.id);
        setCurrentDietPlan(processedPlan);
        safeSetItem("currentDietPlanId", processedPlan.id, { replaceExisting: true });
        
        console.log("Successfully imported and replaced diet plan");
        dietImported = true;
      } else {
        console.error("Failed to validate diet plan, import aborted");
      }
    }
    
    // If any plans were imported, verify and reload if needed
    if (workoutImported || dietImported) {
      console.log("Plans imported, verifying and reloading...");
      
      // Verify that plans were properly saved
      const verifyAndReload = () => {
        const storedWorkoutPlans = safeGetItem<WorkoutPlan[]>("customWorkoutPlans", []);
        const storedDietPlans = safeGetItem<DietPlan[]>("customDietPlans", []);
        
        console.log("Verification check:", {
          workoutImported,
          dietImported,
          storedWorkoutPlans: storedWorkoutPlans.length,
          storedDietPlans: storedDietPlans.length
        });
        
        // If plans weren't saved properly, reload the page
        if ((workoutImported && storedWorkoutPlans.length === 0) || 
            (dietImported && storedDietPlans.length === 0)) {
          console.warn("Plans not properly saved, reloading page...");
          window.location.reload();
          return;
        }
        
        // Force reload plans to ensure state is up to date
        forceReloadPlans();
        
        // Final check after reload
        setTimeout(() => {
          const finalWorkoutPlans = safeGetItem<WorkoutPlan[]>("customWorkoutPlans", []);
          const finalDietPlans = safeGetItem<DietPlan[]>("customDietPlans", []);
          
          if ((workoutImported && finalWorkoutPlans.length === 0) || 
              (dietImported && finalDietPlans.length === 0)) {
            console.warn("Plans still not loaded after reload, forcing page refresh...");
            window.location.reload();
          } else {
            console.log("Import process completed successfully.");
          }
        }, 500);
      };
      
      // Add a small delay to ensure localStorage has been updated
      setTimeout(verifyAndReload, 200);
    } else {
      console.log("No plans were imported.");
    }
  }

  // Function to verify that a plan was properly saved to localStorage
  const verifyPlanSaved = (type: "workout" | "diet", plan: WorkoutPlan | DietPlan) => {
    try {
      console.log(`Verifying ${type} plan save:`, { planId: plan.id, planName: plan.name });
      
      // Check if the plan was properly saved to localStorage
      const savedPlans = type === "workout" 
        ? safeGetItem<WorkoutPlan[]>("customWorkoutPlans", [])
        : safeGetItem<DietPlan[]>("customDietPlans", []);
      
      const savedPlanId = type === "workout"
        ? safeGetItem<string>("currentWorkoutPlanId", "default")
        : safeGetItem<string>("currentDietPlanId", "default");
      
      console.log(`Verification results for ${type} plan:`, {
        savedPlansCount: savedPlans.length,
        savedPlanId,
        expectedPlanId: plan.id,
        match: savedPlans.length > 0 && savedPlanId === plan.id
      });
      
      // If the plan wasn't saved properly, try again
      if (savedPlans.length === 0 || savedPlanId !== plan.id) {
        console.warn(`Plan not properly saved, retrying... (${type})`);
        
        // Try saving again with a more direct approach
        if (type === "workout") {
          console.log("Retrying workout plan save with direct approach");
          localStorage.setItem("customWorkoutPlans", JSON.stringify([plan]));
          localStorage.setItem("currentWorkoutPlanId", plan.id);
        } else {
          console.log("Retrying diet plan save with direct approach");
          localStorage.setItem("customDietPlans", JSON.stringify([plan]));
          localStorage.setItem("currentDietPlanId", plan.id);
        }
        
        // Verify again
        const verifiedPlans = type === "workout" 
          ? safeGetItem<WorkoutPlan[]>("customWorkoutPlans", [])
          : safeGetItem<DietPlan[]>("customDietPlans", []);
        
        const verifiedPlanId = type === "workout"
          ? safeGetItem<string>("currentWorkoutPlanId", "default")
          : safeGetItem<string>("currentDietPlanId", "default");
        
        console.log(`Re-verification results for ${type} plan:`, {
          verifiedPlansCount: verifiedPlans.length,
          verifiedPlanId,
          expectedPlanId: plan.id,
          match: verifiedPlans.length > 0 && verifiedPlanId === plan.id
        });
        
        if (verifiedPlans.length === 0 || verifiedPlanId !== plan.id) {
          console.error(`Failed to save plan after retry (${type})`);
          
          // Last resort: try to update the state directly
          if (type === "workout") {
            console.log("Last resort: updating workout plan state directly");
            const workoutPlan = plan as WorkoutPlan;
            setAvailableWorkoutPlans([workoutPlan]);
            setCurrentWorkoutPlanId(workoutPlan.id);
            setCurrentWorkoutPlan(workoutPlan);
          } else {
            console.log("Last resort: updating diet plan state directly");
            const dietPlan = plan as DietPlan;
            setAvailableDietPlans([dietPlan]);
            setCurrentDietPlanId(dietPlan.id);
            setCurrentDietPlan(dietPlan);
          }
        } else {
          console.log(`Successfully saved plan after retry (${type})`);
        }
      } else {
        console.log(`Plan properly saved (${type})`);
      }
    } catch (error) {
      console.error(`Error verifying plan saved (${type}):`, error);
    }
  }

  // Function to delete all diet plans
  const deleteAllDietPlans = (skipResetToDefault = false) => {
    console.log("Deleting all diet plans...");
    
    // Clear custom diet plans from localStorage
    safeSetItem("customDietPlans", [], {
      replaceExisting: true
    });
    
    // Clear all diet-related data
    try {
      // Clear diet history
      safeSetItem("dietHistory", [], {
        replaceExisting: true
      });
      
      // Clear macro history
      safeSetItem("macroHistory", [], {
        replaceExisting: true
      });
      
      // Clear current diet day
      safeSetItem("currentDietDay", null);
      
      console.log("Cleared all diet-related data");
    } catch (error) {
      console.error("Error clearing diet data:", error);
    }
    
    // Always reset to a blank state in the UI
    if (!skipResetToDefault) {
      // Reset to default diet plan
      const defaultPlan = dietPlans[0];
      setAvailableDietPlans([defaultPlan]);
      setCurrentDietPlanId(defaultPlan.id);
      setCurrentDietPlan(defaultPlan);
      safeSetItem("currentDietPlanId", defaultPlan.id);
      
      console.log("Successfully reset to default diet plan");
    } else {
      // For imports, we want to clear the state completely
      setAvailableDietPlans([]);
      setCurrentDietPlanId("");
      setCurrentDietPlan({
        id: "",
        name: "",
        description: "",
        targetCalories: 0,
        targetProtein: 0,
        targetCarbs: 0,
        targetFats: 0,
        meals: []
      });
      safeSetItem("currentDietPlanId", "");
      
      console.log("Cleared diet plan state completely");
    }
    
    // Force reload plans after a short delay to ensure everything is updated
    setTimeout(() => {
      forceReloadPlans();
    }, 100);
  }

  // Function to delete all workout plans
  const deleteAllWorkoutPlans = (skipResetToDefault = false) => {
    console.log("Deleting all workout plans...");
    
    // Clear custom workout plans from localStorage
    safeSetItem("customWorkoutPlans", [], {
      replaceExisting: true
    });
    
    // Clear all workout-related data
    try {
      // Clear workout history
      safeSetItem("workoutHistory", [], {
        replaceExisting: true
      });
      
      // Clear workout progress
      safeSetItem("workoutProgress", {}, {
        replaceExisting: true
      });
      
      console.log("Cleared all workout-related data");
    } catch (error) {
      console.error("Error clearing workout data:", error);
    }
    
    // Always reset to a blank state in the UI
    if (!skipResetToDefault) {
      // Reset to default workout plan
      const defaultPlan = workoutPlans[0];
      setAvailableWorkoutPlans([defaultPlan]);
      setCurrentWorkoutPlanId(defaultPlan.id);
      setCurrentWorkoutPlan(defaultPlan);
      safeSetItem("currentWorkoutPlanId", defaultPlan.id);
      
      console.log("Successfully reset to default workout plan");
    } else {
      // For imports, we want to clear the state completely
      setAvailableWorkoutPlans([]);
      setCurrentWorkoutPlanId("");
      setCurrentWorkoutPlan({
        id: "",
        name: "",
        description: "",
        days: []
      });
      safeSetItem("currentWorkoutPlanId", "");
      
      console.log("Cleared workout plan state completely");
    }
    
    // Force reload plans after a short delay to ensure everything is updated
    setTimeout(() => {
      forceReloadPlans();
    }, 100);
  }

  // Function to clear localStorage and reload the page as a last resort if plans aren't showing or updating
  const emergencyResetAndReload = () => {
    try {
      console.warn("EMERGENCY RESET: Clearing plan-related data and reloading page...");
      
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
      const clearErrors: string[] = [];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`Successfully removed ${key} from localStorage`);
        } catch (e) {
          clearSuccess = false;
          clearErrors.push(`Failed to remove ${key}: ${e}`);
          console.error(`Error removing ${key} from localStorage:`, e);
        }
      });
      
      // Log results
      if (clearSuccess) {
        console.log("Successfully cleared all plan-related data");
      } else {
        console.error("Some errors occurred while clearing data:", clearErrors);
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
      
      // Reload the page
      console.log("Reloading page...");
      window.location.reload();
    } catch (error) {
      console.error("Error during emergency reset:", error);
      
      // Last resort: try clearing all localStorage and reload
      try {
        console.warn("Emergency reset failed, attempting full localStorage clear...");
        localStorage.clear();
        window.location.reload();
      } catch (e) {
        console.error("Complete localStorage clear failed:", e);
        alert("Failed to reset application data. Please try clearing your browser cache and reloading the page manually.");
      }
    }
  }

  return {
    currentWorkoutPlanId,
    currentWorkoutPlan,
    availableWorkoutPlans,
    changeWorkoutPlan,
    
    currentDietPlanId,
    currentDietPlan,
    availableDietPlans,
    changeDietPlan,
    
    importPlans,
    deleteAllDietPlans,
    deleteAllWorkoutPlans,
    
    forceReloadPlans,
    
    checkPlanDisplayConsistency,
    
    emergencyResetAndReload,
  }
} 