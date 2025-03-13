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
  deleteAllDietPlans: () => void
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
  // Workout plan state
  const [currentWorkoutPlanId, setCurrentWorkoutPlanId] = useState<string>("default")
  const [currentWorkoutPlan, setCurrentWorkoutPlan] = useState<WorkoutPlan>(workoutPlans[0])
  const [availableWorkoutPlans, setAvailableWorkoutPlans] = useState<WorkoutPlan[]>(workoutPlans)
  
  // Diet plan state
  const [currentDietPlanId, setCurrentDietPlanId] = useState<string>("default")
  const [currentDietPlan, setCurrentDietPlan] = useState<DietPlan>(dietPlans[0])
  const [availableDietPlans, setAvailableDietPlans] = useState<DietPlan[]>(dietPlans)

  // Load saved plan preferences and custom plans on mount
  useEffect(() => {
    // Load saved plan IDs
    const savedWorkoutPlanId = safeGetItem("currentWorkoutPlanId", "default")
    const savedDietPlanId = safeGetItem("currentDietPlanId", "default")
    
    // Load custom plans
    const customWorkoutPlans = safeGetItem<WorkoutPlan[]>("customWorkoutPlans", [])
    const customDietPlans = safeGetItem<DietPlan[]>("customDietPlans", [])
    
    // Validate and normalize custom diet plans
    const validatedDietPlans = customDietPlans
      .map(validateAndNormalizeDietPlan)
      .filter(Boolean) as DietPlan[]
    
    // Combine default and custom plans
    const allWorkoutPlans = [...workoutPlans, ...customWorkoutPlans]
    const allDietPlans = [...dietPlans, ...validatedDietPlans]
    
    setAvailableWorkoutPlans(allWorkoutPlans)
    setAvailableDietPlans(allDietPlans)
    
    // Set current plan IDs
    if (savedWorkoutPlanId) {
      setCurrentWorkoutPlanId(savedWorkoutPlanId)
      const foundWorkoutPlan = allWorkoutPlans.find(plan => plan.id === savedWorkoutPlanId)
      if (foundWorkoutPlan) {
        setCurrentWorkoutPlan(foundWorkoutPlan)
      }
    }
    
    if (savedDietPlanId) {
      setCurrentDietPlanId(savedDietPlanId)
      const foundDietPlan = allDietPlans.find(plan => plan.id === savedDietPlanId)
      if (foundDietPlan) {
        const normalizedPlan = validateAndNormalizeDietPlan(foundDietPlan)
        if (normalizedPlan) {
          setCurrentDietPlan(normalizedPlan)
        } else {
          // Fallback to default plan if there's an error
          if (dietPlans && dietPlans.length > 0) {
            const defaultPlan = validateAndNormalizeDietPlan(dietPlans[0])
            if (defaultPlan) {
              setCurrentDietPlanId(defaultPlan.id)
              setCurrentDietPlan(defaultPlan)
              safeSetItem("currentDietPlanId", defaultPlan.id)
            }
          }
        }
      }
    }
  }, [])

  // Function to change workout plan
  const changeWorkoutPlan = (planId: string) => {
    const foundPlan = availableWorkoutPlans.find(plan => plan.id === planId)
    if (foundPlan) {
      setCurrentWorkoutPlanId(planId)
      setCurrentWorkoutPlan(foundPlan)
      safeSetItem("currentWorkoutPlanId", planId)
    }
  }

  // Function to change diet plan
  const changeDietPlan = (planId: string) => {
    const foundPlan = availableDietPlans.find(plan => plan.id === planId)
    if (foundPlan) {
      const normalizedPlan = validateAndNormalizeDietPlan(foundPlan)
      if (normalizedPlan) {
        setCurrentDietPlanId(planId)
        setCurrentDietPlan(normalizedPlan)
        safeSetItem("currentDietPlanId", planId)
      } else {
        // Fallback to default plan if there's an error
        if (dietPlans && dietPlans.length > 0) {
          const defaultPlan = validateAndNormalizeDietPlan(dietPlans[0])
          if (defaultPlan) {
            setCurrentDietPlanId(defaultPlan.id)
            setCurrentDietPlan(defaultPlan)
            safeSetItem("currentDietPlanId", defaultPlan.id)
          }
        }
      }
    }
  }
  
  // Function to import plans
  const importPlans = (importedWorkoutPlans?: WorkoutPlan[], importedDietPlans?: DietPlan[]) => {
    // Handle workout plans import
    if (importedWorkoutPlans && importedWorkoutPlans.length > 0) {
      // Get existing custom plans
      const existingCustomPlans = safeGetItem<WorkoutPlan[]>("customWorkoutPlans", [])
      
      // Filter out plans with duplicate IDs
      const newPlans = importedWorkoutPlans.filter(
        importedPlan => !existingCustomPlans.some(existingPlan => existingPlan.id === importedPlan.id)
      )
      
      // Add prefix to imported plan IDs to avoid conflicts with default plans
      const processedPlans = newPlans.map(plan => ({
        ...plan,
        id: plan.id.startsWith("imported-") ? plan.id : `imported-${plan.id}`
      }))
      
      // Combine with existing custom plans
      const updatedCustomPlans = [...existingCustomPlans, ...processedPlans]
      
      // Save to localStorage
      safeSetItem("customWorkoutPlans", updatedCustomPlans)
      
      // Update available plans
      const updatedAvailablePlans = [...workoutPlans, ...updatedCustomPlans]
      setAvailableWorkoutPlans(updatedAvailablePlans)
    }
    
    // Handle diet plans import
    if (importedDietPlans && importedDietPlans.length > 0) {
      // Get existing custom plans
      const existingCustomPlans = safeGetItem<DietPlan[]>("customDietPlans", [])
      
      // Filter out plans with duplicate IDs
      const newPlans = importedDietPlans.filter(
        importedPlan => !existingCustomPlans.some(existingPlan => existingPlan.id === importedPlan.id)
      )
      
      // Add prefix to imported plan IDs to avoid conflicts with default plans
      // Also ensure each plan has properly structured meals
      const processedPlans = newPlans
        .map(plan => {
          const normalizedPlan = validateAndNormalizeDietPlan(plan)
          if (!normalizedPlan) return null
          
          return {
            ...normalizedPlan,
            id: normalizedPlan.id.startsWith("imported-") ? normalizedPlan.id : `imported-${normalizedPlan.id}`
          }
        })
        .filter(Boolean) as DietPlan[]
      
      // Combine with existing custom plans
      const updatedCustomPlans = [...existingCustomPlans, ...processedPlans]
      
      // Save to localStorage
      safeSetItem("customDietPlans", updatedCustomPlans)
      
      // Update available plans
      const updatedAvailablePlans = [...dietPlans, ...updatedCustomPlans]
      setAvailableDietPlans(updatedAvailablePlans)
    }
  }

  // Function to delete all diet plans
  const deleteAllDietPlans = () => {
    // Clear custom diet plans from localStorage
    safeSetItem("customDietPlans", [])
    
    // Reset to default diet plans
    setAvailableDietPlans([...dietPlans])
    
    // Reset current diet plan to default
    // Make sure we have at least one default diet plan
    if (dietPlans && dietPlans.length > 0) {
      // Create a deep copy of the default plan to ensure we have a fresh instance
      const defaultPlan = validateAndNormalizeDietPlan(dietPlans[0])
      if (defaultPlan) {
        setCurrentDietPlanId(defaultPlan.id)
        setCurrentDietPlan(defaultPlan)
        safeSetItem("currentDietPlanId", defaultPlan.id)
      } else {
        console.error("No default diet plans available")
      }
    } else {
      console.error("No default diet plans available")
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
  }
} 