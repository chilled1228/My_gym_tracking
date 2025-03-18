"use client"

import { useState, useEffect } from "react"
import { dietPlans, DietPlan } from "@/lib/plan-templates"
import { safeGetItem, safeSetItem } from "@/lib/utils"

interface UsePlanManagerReturn {
  // Diet plan management
  currentDietPlan: DietPlan
  
  // Workout plan management
  currentWorkoutPlan: any
  
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

export function usePlanManager(): UsePlanManagerReturn {
  // Diet plan state
  const [currentDietPlan, setCurrentDietPlan] = useState<DietPlan>(() => {
    // Try to load from localStorage first
    const savedDietPlan = safeGetItem<DietPlan | null>("currentDietPlan", null);
    if (savedDietPlan) {
      return savedDietPlan;
    }
    // Fall back to default plan
    return dietPlans[0];
  });
  
  // Workout plan state
  const [currentWorkoutPlan, setCurrentWorkoutPlan] = useState<any>(() => {
    // Try to load from localStorage first
    const savedWorkoutPlan = safeGetItem<any>("currentWorkoutPlan", null);
    if (savedWorkoutPlan) {
      return savedWorkoutPlan;
    }
    // Fall back to default plan
    return {
      name: "Workout Plan (6 Days a Week)",
      days: [
        {
          name: "Day 1: Chest & Triceps",
          exercises: [
            {
              name: "Bench Press",
              sets: "4x8-10",
              reps: 0,
              completed: false
            },
            {
              name: "Incline Dumbbell Press",
              sets: "4x8-10",
              reps: 0,
              completed: false
            },
            {
              name: "Cable Flys",
              sets: "3x12",
              reps: 0,
              completed: false
            },
            {
              name: "Dips",
              sets: "3x10",
              reps: 0,
              completed: false
            },
            {
              name: "Skull Crushers",
              sets: "4x10",
              reps: 0,
              completed: false
            },
            {
              name: "Rope Triceps Pushdown",
              sets: "3x12",
              reps: 0,
              completed: false
            }
          ]
        },
        {
          name: "Day 2: Back & Biceps",
          exercises: [
            {
              name: "Deadlifts",
              sets: "4x6-8",
              reps: 0,
              completed: false
            },
            {
              name: "Pull-Ups",
              sets: "4x10",
              reps: 0,
              completed: false
            },
            {
              name: "Bent-over Rows",
              sets: "4x8-10",
              reps: 0,
              completed: false
            },
            {
              name: "Lat Pulldown",
              sets: "3x12",
              reps: 0,
              completed: false
            },
            {
              name: "Barbell Bicep Curls",
              sets: "4x10",
              reps: 0,
              completed: false
            },
            {
              name: "Hammer Curls",
              sets: "3x12",
              reps: 0,
              completed: false
            }
          ]
        },
        {
          name: "Day 3: Legs & Abs",
          exercises: [
            {
              name: "Squats",
              sets: "4x8-10",
              reps: 0,
              completed: false
            },
            {
              name: "Romanian Deadlifts",
              sets: "3x10",
              reps: 0,
              completed: false
            },
            {
              name: "Leg Press",
              sets: "4x12",
              reps: 0,
              completed: false
            },
            {
              name: "Leg Curls",
              sets: "3x12",
              reps: 0,
              completed: false
            },
            {
              name: "Hanging Leg Raises",
              sets: "4x12",
              reps: 0,
              completed: false
            },
            {
              name: "Cable Crunches",
              sets: "3x15",
              reps: 0,
              completed: false
            }
          ]
        },
        {
          name: "Day 4: Shoulders & Traps",
          exercises: [
            {
              name: "Overhead Press",
              sets: "4x8-10",
              reps: 0,
              completed: false
            },
            {
              name: "Lateral Raises",
              sets: "4x12",
              reps: 0,
              completed: false
            },
            {
              name: "Rear Delt Flys",
              sets: "3x12",
              reps: 0,
              completed: false
            },
            {
              name: "Shrugs",
              sets: "4x15",
              reps: 0,
              completed: false
            }
          ]
        },
        {
          name: "Day 5: Arms & Abs",
          exercises: [
            {
              name: "Barbell Biceps Curl",
              sets: "4x10",
              reps: 0,
              completed: false
            },
            {
              name: "Close-Grip Bench Press",
              sets: "4x10",
              reps: 0,
              completed: false
            },
            {
              name: "Concentration Curls",
              sets: "3x12",
              reps: 0,
              completed: false
            },
            {
              name: "Rope Pushdowns",
              sets: "3x12",
              reps: 0,
              completed: false
            },
            {
              name: "Hanging Leg Raises",
              sets: "4x12",
              reps: 0,
              completed: false
            },
            {
              name: "Planks",
              sets: "3x1 min",
              reps: 0,
              completed: false
            }
          ]
        },
        {
          name: "Day 6: Cardio & Core",
          exercises: [
            {
              name: "HIIT",
              sets: "15-20 min",
              reps: 0,
              completed: false
            },
            {
              name: "Cable Twists",
              sets: "3x12",
              reps: 0,
              completed: false
            },
            {
              name: "Russian Twists",
              sets: "3x15",
              reps: 0,
              completed: false
            },
            {
              name: "Decline Sit-Ups",
              sets: "4x12",
              reps: 0,
              completed: false
            }
          ]
        }
      ]
    };
  });

  // Save currentDietPlan to localStorage whenever it changes
  useEffect(() => {
    safeSetItem("currentDietPlan", currentDietPlan);
  }, [currentDietPlan]);

  // Save currentWorkoutPlan to localStorage whenever it changes
  useEffect(() => {
    safeSetItem("currentWorkoutPlan", currentWorkoutPlan);
  }, [currentWorkoutPlan]);

  // For debouncing the consistency check
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  
  // Function to force reload the current plans from localStorage
  const forceReloadPlans = () => {
    try {
      console.log("Forcing reload of diet plans...");
      
      // Load custom diet plans from localStorage
      const customDietPlans = safeGetItem<DietPlan[]>("customDietPlans", []);
      
      // Get the current diet plan ID from localStorage
      const currentDietPlanIdFromStorage = safeGetItem<string>("currentDietPlanId", "fitness-diet");
      
      console.log("Current diet plan ID from storage:", 
        currentDietPlanIdFromStorage
      );
      
      // Check if we have custom diet plans
      if (customDietPlans && Array.isArray(customDietPlans) && customDietPlans.length > 0) {
        // Use the first custom diet plan
        const customPlan = customDietPlans[0]
        console.log("Setting custom diet plan:", customPlan);
        setCurrentDietPlan(customPlan)
        console.log("Reloaded custom diet plan:", customPlan.name)
      } else {
        // No custom diet plans, check if we have a current diet plan ID
        if (currentDietPlanIdFromStorage === "") {
          // Clear the state completely
          console.log("No diet plan ID found, clearing diet plan state");
          setCurrentDietPlan({
            id: "",
            name: "No Diet Plan",
            description: "No diet plan available",
            targetCalories: 0,
            targetProtein: 0,
            targetCarbs: 0,
            targetFats: 0,
            meals: []
          })
          console.log("Cleared diet plan state")
        } else if (currentDietPlanIdFromStorage === "fitness-diet" || currentDietPlanIdFromStorage === "default") {
          // Handle both "fitness-diet" and "default" IDs by using the default diet plan
          // This fixes the infinite loop issue when "default" is stored in localStorage
          const defaultPlan = dietPlans[0]
          
          // If the ID was "default", update it to "fitness-diet" in localStorage
          if (currentDietPlanIdFromStorage === "default") {
            safeSetItem("currentDietPlanId", "fitness-diet");
            console.log("Updated 'default' ID to 'fitness-diet' in localStorage");
          }
          
          console.log("Setting default diet plan:", defaultPlan);
          setCurrentDietPlan(defaultPlan)
          console.log("Using default diet plan")
        } else {
          // Clear the state if the ID doesn't match any known plan
          console.log("Unknown diet plan ID, clearing diet plan state");
          setCurrentDietPlan({
            id: "",
            name: "No Diet Plan",
            description: "No diet plan available",
            targetCalories: 0,
            targetProtein: 0,
            targetCarbs: 0,
            targetFats: 0,
            meals: []
          })
          console.log("Cleared diet plan state")
        }
      }
    } catch (error) {
      console.error("Error reloading diet plans:", error)
    }
  }
  
  // Function to check if the current diet plan is displayed correctly
  const checkPlanDisplayConsistency = () => {
    try {
      // Debounce the consistency check (once per 5 seconds)
      const now = Date.now();
      if (now - lastCheckTime < 5000) {
        return; // Skip if we just checked recently
      }
      setLastCheckTime(now);
      
      console.log("Checking diet plan display consistency...");
      
      // Get the current diet plan ID from localStorage
      const currentDietPlanIdFromStorage = safeGetItem<string>("currentDietPlanId", "fitness-diet");
      
      // Special handling for "default" ID to match it with "fitness-diet"
      if (currentDietPlanIdFromStorage === "default") {
        safeSetItem("currentDietPlanId", "fitness-diet");
        console.log("Updated 'default' ID to 'fitness-diet' in localStorage");
        return; // Don't force reload, just update the ID
      }
      
      // Check if the current diet plan ID matches what's in localStorage
      if (currentDietPlan.id !== currentDietPlanIdFromStorage) {
        console.log("Diet plan ID mismatch, reloading plans");
        forceReloadPlans();
      } else {
        console.log("Diet plan display is consistent");
      }
    } catch (error) {
      console.error("Error checking diet plan display consistency:", error)
    }
  }
  
  // Function to delete all diet plans
  const deleteAllDietPlans = (skipResetToDefault: boolean = false) => {
    try {
      console.log("Deleting all diet plans...");
      
      // Clear the custom diet plans from localStorage
      safeSetItem("customDietPlans", []);
      
      if (!skipResetToDefault) {
        // Reset to default diet plan
        const defaultPlan = dietPlans[0];
        setCurrentDietPlan(defaultPlan);
        
        // Save the current diet plan ID to localStorage
        safeSetItem("currentDietPlanId", defaultPlan.id);
        
        console.log(`Reset to default diet plan: ${defaultPlan.name}`);
      }
    } catch (error) {
      console.error("Error deleting all diet plans:", error)
    }
  }
  
  // Function to delete all workout plans
  const deleteAllWorkoutPlans = (skipResetToDefault: boolean = false) => {
    try {
      console.log("Deleting all workout plans...");
      
      // Clear the custom workout plans from localStorage
      safeSetItem("customWorkoutPlans", []);
      
      if (!skipResetToDefault) {
        // Reset to default workout plan
        const defaultWorkoutPlan = {
          name: "Workout Plan (6 Days a Week)",
          days: [
            {
              name: "Day 1: Chest & Triceps",
              exercises: [
                {
                  name: "Bench Press",
                  sets: "4x8-10",
                  reps: 0,
                  completed: false
                },
                {
                  name: "Incline Dumbbell Press",
                  sets: "4x8-10",
                  reps: 0,
                  completed: false
                },
                {
                  name: "Cable Flys",
                  sets: "3x12",
                  reps: 0,
                  completed: false
                },
                {
                  name: "Dips",
                  sets: "3x10",
                  reps: 0,
                  completed: false
                },
                {
                  name: "Skull Crushers",
                  sets: "4x10",
                  reps: 0,
                  completed: false
                },
                {
                  name: "Rope Triceps Pushdown",
                  sets: "3x12",
                  reps: 0,
                  completed: false
                }
              ]
            },
            // Add other days as needed
          ]
        };
        setCurrentWorkoutPlan(defaultWorkoutPlan);
        
        // Save the current workout plan ID to localStorage
        safeSetItem("currentWorkoutPlanId", "default-workout");
        
        console.log(`Reset to default workout plan`);
      }
    } catch (error) {
      console.error("Error deleting all workout plans:", error)
    }
  }
  
  // Function to emergency reset and reload
  const emergencyResetAndReload = () => {
    try {
      console.log("Emergency reset and reload...");
      
      // Reset to default diet plan
      const defaultPlan = dietPlans[0];
      setCurrentDietPlan(defaultPlan);
      
      // Save the current diet plan ID to localStorage - ensure we use "fitness-diet" not "default"
      safeSetItem("currentDietPlanId", "fitness-diet");
      
      // Remove custom diet plans from localStorage
      safeSetItem("customDietPlans", []);
      
      // Reset the lastCheckTime to allow immediate consistency check
      setLastCheckTime(0);
      
      console.log("Emergency reset complete");
    } catch (error) {
      console.error("Error during emergency reset:", error)
    }
  }
  
  // Load plans on mount - but only if needed
  useEffect(() => {
    // Check if we already have a valid diet plan
    const hasValidDietPlan = currentDietPlan && currentDietPlan.id === "fitness-diet";
    if (!hasValidDietPlan) {
      console.log("No valid diet plan found on mount, forcing reload");
      forceReloadPlans();
    } else {
      console.log("Valid diet plan already loaded, skipping initial reload");
    }
  }, []);
  
  return {
    currentDietPlan,
    currentWorkoutPlan,
    deleteAllDietPlans,
    deleteAllWorkoutPlans,
    forceReloadPlans,
    checkPlanDisplayConsistency,
    emergencyResetAndReload
  }
} 