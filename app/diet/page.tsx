"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, PieChart, Calendar, ChevronLeft, ChevronRight, Check, ArrowRight, Trash2, Utensils, RotateCcw, MoreHorizontal, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { MobileLayout } from "@/components/mobile-layout"
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, isAfter, isBefore, startOfDay } from "date-fns"
import { useSearchParams } from "next/navigation"
import { safeGetItem, safeSetItem } from "@/lib/utils"
import { useSyncIndicator } from "@/hooks/use-sync-indicator"
import { usePlanManager } from "@/hooks/use-plan-manager"
import { PlanSelector } from "@/components/plan-selector"
import { PlanImport } from "@/components/plan-import"
import { PlanExport } from "@/components/plan-export"
import { Meal, MealItem } from "@/lib/plan-templates"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DailyMacros {
  date: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

// Add new interface for tracking diet by day
interface DietDay {
  date: string // ISO date string
  meals: Meal[]
  completed: boolean
}

// Create a client component that uses useSearchParams
function DietPageContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<string>("meals")
  const showSyncIndicator = useSyncIndicator()
  
  // Use the plan manager hook
  const { 
    currentDietPlan, 
    availableDietPlans, 
    currentDietPlanId, 
    changeDietPlan,
    importPlans,
    deleteAllDietPlans,
    checkPlanDisplayConsistency,
    emergencyResetAndReload
  } = usePlanManager()
  
  // State for tracking the current date and diet
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [currentDietDay, setCurrentDietDay] = useState<DietDay | null>(null)
  const [dietHistory, setDietHistory] = useState<DietDay[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showWeeklyView, setShowWeeklyView] = useState(false)
  
  // Check plan display consistency on mount
  useEffect(() => {
    // Ensure the diet plan is displayed correctly
    checkPlanDisplayConsistency();
  }, [checkPlanDisplayConsistency]);
  
  // Load diet history on mount
  useEffect(() => {
    const savedHistory = safeGetItem("dietHistory", [])
    if (savedHistory && Array.isArray(savedHistory)) {
      setDietHistory(savedHistory)
    }
    
    // Set active tab from URL if present
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])
  
  // Force refresh macroHistory data when the page loads
  useEffect(() => {
    // If we have a current diet day, force refresh the macroHistory data
    if (currentDietDay && currentDietDay.meals) {
      // Force save the daily macros to ensure dashboard is updated immediately
      saveDailyMacrosForDashboard(currentDietDay.meals, currentDietDay.date)
    }
  }, [currentDietDay])
  
  // Update current diet when date changes or diet plan changes
  useEffect(() => {
    const dateString = currentDate.toISOString().split('T')[0]
    const existingDiet = dietHistory.find(
      (diet) => diet.date === dateString
    )
    
    if (existingDiet) {
      setCurrentDietDay(existingDiet)
    } else {
      // Create a new diet day based on the current plan
      createNewDietDay(dateString)
    }
  }, [currentDate, dietHistory, currentDietPlan, currentDietPlanId])
  
  // Create a new diet day for the current date
  const createNewDietDay = (dateString: string) => {
    // Make sure we have a valid diet plan
    if (!currentDietPlan) {
      console.error("Cannot create diet day: current diet plan is undefined")
      toast({
        title: "Error",
        description: "No diet plan available. Please select a plan.",
        variant: "destructive",
      })
      return
    }
    
    try {
      // Check if the current diet plan has meals
      if (!currentDietPlan.meals || !Array.isArray(currentDietPlan.meals) || currentDietPlan.meals.length === 0) {
        console.error("Cannot create diet day: current diet plan has no meals", currentDietPlan)
        
        // Create a default meal if none exists
        const defaultMeals = [
          {
            name: "Breakfast",
            time: "8:00 AM",
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            items: [
              {
                name: "Add your breakfast items",
                completed: false,
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: 0
              }
            ]
          },
          {
            name: "Lunch",
            time: "12:00 PM",
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            items: [
              {
                name: "Add your lunch items",
                completed: false,
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: 0
              }
            ]
          },
          {
            name: "Dinner",
            time: "6:00 PM",
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            items: [
              {
                name: "Add your dinner items",
                completed: false,
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: 0
              }
            ]
          }
        ]
        
        const newDietDay: DietDay = {
          date: dateString,
          meals: defaultMeals,
          completed: false,
        }
        
        setCurrentDietDay(newDietDay)
        
        // Save the default meals to history
        updateDietHistory(defaultMeals, dateString)
        autoSaveDietProgress(defaultMeals, dateString)
        
        toast({
          title: "Default Meals Created",
          description: "Your diet plan didn't have any meals, so we created some default ones for you.",
        })
        
        return
      }
      
      // Deep clone the meals from the current diet plan
      const meals = JSON.parse(JSON.stringify(currentDietPlan.meals))
      
      // Ensure each meal has the required properties
      const validatedMeals = meals.map((meal: Meal) => {
        // Ensure meal has items array
        if (!meal.items || !Array.isArray(meal.items)) {
          meal.items = []
        }
        
        // If meal has no items, add a placeholder item
        if (meal.items.length === 0) {
          meal.items.push({
            name: `Add your ${meal.name.toLowerCase()} items`,
            completed: false,
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0
          })
        }
        
        // Ensure each meal item has the required properties
        meal.items = meal.items.map((item: MealItem) => {
          return {
            name: item.name || "Unknown item",
            completed: item.completed || false,
            calories: item.calories || 0,
            protein: item.protein || 0,
            carbs: item.carbs || 0,
            fats: item.fats || 0
          }
        })
        
        return meal
      })
      
      const newDietDay: DietDay = {
        date: dateString,
        meals: validatedMeals,
        completed: false,
      }
      
      setCurrentDietDay(newDietDay)
      
      // Save the new diet day to history
      updateDietHistory(validatedMeals, dateString)
      autoSaveDietProgress(validatedMeals, dateString)
    } catch (error) {
      console.error("Error creating new diet day:", error)
      
      // Create an empty diet day as fallback
      const emptyDietDay: DietDay = {
        date: dateString,
        meals: [],
        completed: false,
      }
      
      setCurrentDietDay(emptyDietDay)
      
      toast({
        title: "Error Creating Diet Day",
        description: "There was an error creating your diet day. Please try again or select a different plan.",
        variant: "destructive",
      })
    }
  }
  
  // Navigation functions
  const navigateToDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    const existingDiet = dietHistory.find(
      (diet) => diet.date === dateString
    )
    
    if (existingDiet) {
      setCurrentDietDay(existingDiet)
    } else {
      // Create a new diet day based on the current plan
      createNewDietDay(dateString)
    }
    
    setCurrentDate(date)
  }
  
  const goToPreviousDay = () => {
    const previousDay = new Date(currentDate)
    previousDay.setDate(previousDay.getDate() - 1)
    navigateToDate(previousDay)
  }
  
  const goToNextDay = () => {
    const nextDay = new Date(currentDate)
    nextDay.setDate(nextDay.getDate() + 1)
    navigateToDate(nextDay)
  }
  
  const moveToNextWeek = () => {
    const nextWeek = addWeeks(currentDate, 1)
    navigateToDate(nextWeek)
  }
  
  // Meal interaction functions
  const toggleMealItem = (mealIndex: number, itemIndex: number) => {
    if (!currentDietDay) return
    
    const updatedMeals = [...currentDietDay.meals]
    if (!updatedMeals[mealIndex] || !updatedMeals[mealIndex].items) {
      console.error("Invalid meal or items array")
      return
    }
    
    // Toggle the completed status
    updatedMeals[mealIndex].items[itemIndex].completed = !updatedMeals[mealIndex].items[itemIndex].completed
    
    // Check if all meal items are completed
    const allCompleted = updatedMeals.every(meal => 
      meal.items && meal.items.every(item => item.completed)
    )
    
    // Update the current diet day
    const updatedDietDay: DietDay = {
      ...currentDietDay,
      meals: updatedMeals,
      completed: allCompleted
    }
    
    setCurrentDietDay(updatedDietDay)
    
    // Update diet history with the meals array
    updateDietHistory(updatedMeals, currentDietDay.date)
    
    // Force save the daily macros immediately to ensure dashboard shows latest data
    saveDailyMacrosForDashboard(updatedMeals, currentDietDay.date)
  }
  
  // Update functions
  const updateCurrentDietDay = (meals: Meal[]) => {
    if (!currentDietDay) {
      console.error("Cannot update current diet day: currentDietDay is null");
      return;
    }
    
    if (!meals || !Array.isArray(meals)) {
      console.error("Cannot update current diet day: meals is not an array");
      return;
    }
    
    // Validate meals to ensure they have the required properties
    const validatedMeals = meals.map(meal => {
      // Ensure meal has items array
      if (!meal.items || !Array.isArray(meal.items)) {
        return { ...meal, items: [] };
      }
      return meal;
    });
    
    // Check if all meal items are completed
    const allCompleted = validatedMeals.every(meal => 
      meal.items && meal.items.length > 0 && meal.items.every(item => item.completed)
    );
    
    const updatedDietDay: DietDay = {
      ...currentDietDay,
      meals: validatedMeals,
      completed: allCompleted,
    };
    
    // Update diet history
    updateDietHistory(validatedMeals, currentDietDay.date);
    
    // Auto-save progress
    autoSaveDietProgress(validatedMeals, currentDietDay.date);
    
    // Update current diet day
    setCurrentDietDay(updatedDietDay);
  }
  
  const updateDietHistory = (meals: Meal[], dateOverride?: string) => {
    // Use dateOverride if provided, otherwise try to get date from currentDietDay
    const dateString = dateOverride || (currentDietDay ? currentDietDay.date : null);
    
    if (!dateString) {
      console.error("Cannot update diet history: no date available");
      return;
    }
    
    if (!meals || !Array.isArray(meals)) {
      console.error("Cannot update diet history: meals is not an array");
      return;
    }
    
    // Validate meals to ensure they have the required properties
    const validatedMeals = meals.map(meal => {
      // Ensure meal has items array
      if (!meal.items || !Array.isArray(meal.items)) {
        return { ...meal, items: [] };
      }
      return meal;
    });
    
    const updatedHistory = [...dietHistory];
    const existingIndex = updatedHistory.findIndex(
      (item) => item && item.date === dateString
    );
    
    // Check if all meal items are completed
    const allCompleted = validatedMeals.every(meal => 
      meal.items && meal.items.length > 0 && meal.items.every(item => item.completed)
    );
    
    if (existingIndex >= 0) {
      updatedHistory[existingIndex] = {
        ...updatedHistory[existingIndex],
        meals: validatedMeals,
        completed: allCompleted,
      };
    } else {
      updatedHistory.push({
        date: dateString,
        meals: validatedMeals,
        completed: allCompleted,
      });
    }
    
    setDietHistory(updatedHistory);
  }
  
  const autoSaveDietProgress = (meals: Meal[], dateOverride?: string) => {
    // Use dateOverride if provided, otherwise try to get date from currentDietDay
    const dateString = dateOverride || (currentDietDay ? currentDietDay.date : null);
    
    if (!dateString) {
      console.error("Cannot auto-save diet progress: no date available");
      return;
    }
    
    if (!meals || !Array.isArray(meals)) {
      console.error("Cannot auto-save diet progress: meals is not an array");
      return;
    }
    
    // Validate meals to ensure they have the required properties
    const validatedMeals = meals.map(meal => {
      // Ensure meal has items array
      if (!meal.items || !Array.isArray(meal.items)) {
        return { ...meal, items: [] };
      }
      return meal;
    });
    
    // Get a copy of the current diet history
    const updatedHistory = [...dietHistory];
    const existingIndex = updatedHistory.findIndex(
      (item) => item && item.date === dateString
    );
    
    // Check if all meal items are completed
    const allCompleted = validatedMeals.every(meal => 
      meal.items && meal.items.length > 0 && meal.items.every(item => item.completed)
    );
    
    // Create a new diet day or update existing one
    let newDietHistory: DietDay[];
    
    if (existingIndex >= 0) {
      // Update existing entry
      newDietHistory = updatedHistory.map(item => 
        item.date === dateString 
          ? { ...item, meals: validatedMeals, completed: allCompleted }
          : item
      );
    } else {
      // Add new entry
      newDietHistory = [
        ...updatedHistory,
        {
          date: dateString,
          meals: validatedMeals,
          completed: allCompleted,
        }
      ];
    }
    
    // Save with data cleanup options
    safeSetItem("dietHistory", newDietHistory, {
      maxItems: 90, // Keep data for last 90 days
      maxAge: 90,   // Remove entries older than 90 days
      validateFn: (item) => {
        // Validate that the item has all required properties
        return item && 
               typeof item.date === 'string' && 
               Array.isArray(item.meals) &&
               typeof item.completed === 'boolean';
      }
    });
    
    // Update state with the new history
    setDietHistory(newDietHistory);
    
    // Save daily macros for dashboard
    saveDailyMacrosForDashboard(validatedMeals, dateString);
    
    setLastSaved(new Date());
    showSyncIndicator();
  }
  
  // Save daily macros for dashboard
  const saveDailyMacrosForDashboard = (meals: Meal[], dateString: string) => {
    if (!meals || !Array.isArray(meals)) {
      console.error("Cannot save daily macros: meals is not an array")
      return
    }
    
    // Validate meals to ensure they have the required properties
    const validatedMeals = meals.map(meal => {
      // Ensure meal has items array
      if (!meal.items || !Array.isArray(meal.items)) {
        return { ...meal, items: [] }
      }
      return meal
    })
    
    // Calculate total macros for the day - only count completed items
    const totalCalories = validatedMeals.reduce(
      (sum, meal) => sum + meal.items.reduce(
        (mealSum, item) => mealSum + (item.completed ? (item.calories || 0) : 0), 0
      ), 0
    )
    
    const totalProtein = validatedMeals.reduce(
      (sum, meal) => sum + meal.items.reduce(
        (mealSum, item) => mealSum + (item.completed ? (item.protein || 0) : 0), 0
      ), 0
    )
    
    const totalCarbs = validatedMeals.reduce(
      (sum, meal) => sum + meal.items.reduce(
        (mealSum, item) => mealSum + (item.completed ? (item.carbs || 0) : 0), 0
      ), 0
    )
    
    const totalFats = validatedMeals.reduce(
      (sum, meal) => sum + meal.items.reduce(
        (mealSum, item) => mealSum + (item.completed ? (item.fats || 0) : 0), 0
      ), 0
    )
    
    // Create daily macros object
    const dailyMacros: DailyMacros = {
      date: dateString,
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fats: Math.round(totalFats)
    }
    
    // Get existing macro history
    const macroHistory = safeGetItem<DailyMacros[]>("macroHistory", [])
    
    // Find if we already have an entry for this date
    const existingIndex = macroHistory.findIndex(item => item.date === dateString)
    
    // Create a new array with updated data
    let updatedMacroHistory: DailyMacros[];
    
    if (existingIndex >= 0) {
      // Update existing entry
      updatedMacroHistory = macroHistory.map(item => 
        item.date === dateString ? dailyMacros : item
      );
    } else {
      // Add new entry
      updatedMacroHistory = [...macroHistory, dailyMacros];
    }
    
    // Save updated history with data cleanup options
    safeSetItem("macroHistory", updatedMacroHistory, {
      maxItems: 90, // Keep data for last 90 days
      maxAge: 90,   // Remove entries older than 90 days
      validateFn: (item) => {
        // Validate that the item has all required properties
        return item && 
               typeof item.date === 'string' && 
               typeof item.calories === 'number' &&
               typeof item.protein === 'number' &&
               typeof item.carbs === 'number' &&
               typeof item.fats === 'number';
      }
    });
    
    console.log("Saved daily macros for dashboard:", dailyMacros);
  }
  
  const saveProgress = () => {
    if (!currentDietDay) {
      toast({
        title: "No Diet Plan Available",
        description: "There is no diet plan to save for this date.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Save diet history to localStorage with data cleanup
      safeSetItem("dietHistory", dietHistory, {
        maxItems: 90, // Keep data for last 90 days
        maxAge: 90,   // Remove entries older than 90 days
        validateFn: (item) => {
          // Validate that the item has all required properties
          return item && 
                 typeof item.date === 'string' && 
                 Array.isArray(item.meals) &&
                 typeof item.completed === 'boolean';
        }
      });
      
      // Update last saved timestamp
      setLastSaved(new Date());
      
      // Show sync indicator
      showSyncIndicator();
      
      // Show success toast
      toast({
        title: "Progress Saved",
        description: "Your diet progress has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving progress:", error);
      // Show error toast
      toast({
        title: "Error Saving Progress",
        description: "There was an error saving your progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }
  
  const resetDay = () => {
    // Create a new diet day based on the current plan
    const dateString = currentDate.toISOString().split('T')[0]
    createNewDietDay(dateString)
    
    // Update diet history by removing the entry for the current date
    const updatedHistory = dietHistory.filter(
      (diet) => diet.date !== dateString
    )
    
    // Update macro history by removing the entry for the current date
    const macroHistory = safeGetItem<DailyMacros[]>("macroHistory", [])
    const updatedMacroHistory = macroHistory.filter(
      (macro) => macro.date !== dateString
    )
    
    // Save updated histories with data cleanup
    safeSetItem("dietHistory", updatedHistory, {
      maxItems: 90, // Keep data for last 90 days
      maxAge: 90,   // Remove entries older than 90 days
    });
    
    safeSetItem("macroHistory", updatedMacroHistory, {
      maxItems: 90, // Keep data for last 90 days
      maxAge: 90,   // Remove entries older than 90 days
    });
    
    // Update state
    setDietHistory(updatedHistory)
    
    // Show success toast
    toast({
      title: "Day Reset",
      description: "Your diet for today has been reset to the plan default.",
    })
  }
  
  // Helper functions for UI
  const getMealConsumedCalories = (mealIndex: number) => {
    if (!currentDietDay) return 0
    
    // Add defensive check to ensure the meal exists
    const meal = currentDietDay.meals[mealIndex]
    if (!meal || !meal.items) return 0
    
    return meal.items
      .filter(item => item.completed)
      .reduce((sum, item) => sum + item.calories, 0)
  }
  
  const getMealConsumedProtein = (mealIndex: number) => {
    if (!currentDietDay) return 0
    
    // Add defensive check to ensure the meal exists
    const meal = currentDietDay.meals[mealIndex]
    if (!meal || !meal.items) return 0
    
    return meal.items
      .filter(item => item.completed)
      .reduce((sum, item) => sum + item.protein, 0)
  }
  
  const getWeekDays = (date: Date) => {
    const startDate = startOfWeek(date, { weekStartsOn: 1 }) // Start on Monday
    const weekDates = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      weekDates.push(date)
    }
    
    return weekDates
  }
  
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? addWeeks(currentDate, -1) 
      : addWeeks(currentDate, 1)
    navigateToDate(newDate)
  }
  
  const getDayData = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    const dietDay = dietHistory.find(day => day.date === dateString)
    
    return {
      hasDiet: !!dietDay,
      isCompleted: dietDay?.completed || false
    }
  }
  
  const isToday = (date: Date) => {
    const today = new Date()
    return isSameDay(date, today)
  }
  
  const hasDietPlan = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return dietHistory.some((diet) => diet.date === dateString)
  }
  
  const isDietCompleted = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    const diet = dietHistory.find((diet) => diet.date === dateString)
    return diet ? diet.completed : false
  }
  
  const formatCurrentDate = (date: Date) => {
    return format(date, "EEEE, MMMM d, yyyy")
  }
  
  // Calculate total consumed nutrients for the day
  const getTotalConsumed = () => {
    if (!currentDietDay || !currentDietDay.meals) {
      return { calories: 0, protein: 0, carbs: 0, fats: 0 }
    }
    
    return currentDietDay.meals.reduce(
      (totals, meal) => {
        if (meal && meal.items) {
          meal.items.forEach(item => {
            if (item && item.completed) {
              totals.calories += item.calories || 0
              totals.protein += item.protein || 0
              totals.carbs += item.carbs || 0
              totals.fats += item.fats || 0
            }
          })
        }
        return totals
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    )
  }
  
  // Calculate target nutrients for the day
  const getTargets = () => {
    if (!currentDietPlan) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0
      }
    }
    
    return {
      calories: currentDietPlan.targetCalories || 0,
      protein: currentDietPlan.targetProtein || 0,
      carbs: currentDietPlan.targetCarbs || 0,
      fats: currentDietPlan.targetFats || 0
    }
  }
  
  // Calculate percentage of target consumed
  const getPercentage = (consumed: number, target: number) => {
    if (target === 0) return 0
    const percentage = (consumed / target) * 100
    return Math.min(percentage, 100) // Cap at 100%
  }
  
  // Add a function to handle deleting all diet plans with confirmation
  const handleDeleteAllDietPlans = () => {
    if (confirm("Are you sure you want to delete all diet plans? This will remove all diet plans and clear all diet history. This action cannot be undone.")) {
      // Delete all diet plans
      deleteAllDietPlans()
      
      // Clear the diet history completely
      setDietHistory([])
      safeSetItem("dietHistory", [], {
        replaceExisting: true
      })
      
      // Clear the current diet day
      setCurrentDietDay(null)
      safeSetItem("currentDietDay", null)
      
      // Clear macro history
      safeSetItem("macroHistory", [], {
        replaceExisting: true
      })
      
      toast({
        title: "Diet Plans Deleted",
        description: "All diet plans and history have been deleted. The page will reload to apply changes.",
      })
      
      // Force a page reload after a short delay to ensure everything is reset
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    }
  }
  
  // Render the diet page
  return (
    <MobileLayout>
      <div className="container px-2 sm:px-4 mx-auto pt-4 pb-6">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Diet Tracking</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => checkPlanDisplayConsistency()}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Refresh Plan
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => {
                      const dateString = currentDate.toISOString().split('T')[0]
                      createNewDietDay(dateString)
                      toast({
                        title: "Day Reset",
                        description: "Diet day has been reset to the plan default.",
                      })
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Day
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={emergencyResetAndReload}
                    className="text-red-500 focus:text-red-500"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Emergency Reset
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <div className="flex flex-wrap gap-2">
              <PlanSelector
                type="diet"
                currentPlanId={currentDietPlanId}
                availablePlans={availableDietPlans}
                onPlanChange={changeDietPlan}
              />
              <PlanImport onImport={importPlans} />
              <PlanExport 
                workoutPlans={[]} 
                dietPlans={availableDietPlans} 
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAllDietPlans}
              className="gap-2 text-destructive hover:text-destructive w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4" />
              Delete All Plans
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="meals">
              <Utensils className="h-4 w-4 mr-2" />
              Meals
            </TabsTrigger>
            <TabsTrigger value="macros">
              <PieChart className="h-4 w-4 mr-2" />
              Macros
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="meals" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToPreviousDay}
                      className="h-7 w-7"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={isToday(currentDate) ? "default" : "outline"}
                      size="sm"
                      onClick={() => navigateToDate(new Date())}
                      className="h-7 px-2 text-xs"
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToNextDay}
                      className="h-7 w-7"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWeeklyView(!showWeeklyView)}
                    className="h-7 px-2 text-xs"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {showWeeklyView ? "Hide" : "Show"} Calendar
                  </Button>
                </div>
                
                <CardTitle className="text-base mt-2">
                  {formatCurrentDate(currentDate)}
                </CardTitle>
              </CardHeader>
              
              {showWeeklyView && (
                <div className="px-2 pb-2 overflow-x-auto">
                  <div className="flex space-x-1 min-w-max">
                    {getWeekDays(currentDate).map((date) => (
                      <div
                        key={date.toISOString()}
                        onClick={() => navigateToDate(date)}
                        className={`flex flex-col items-center justify-center p-1 rounded-lg cursor-pointer min-w-[36px] ${
                          isSameDay(date, currentDate)
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="text-[10px]">{format(date, "EEE")}</div>
                        <div className="font-medium text-xs">{format(date, "d")}</div>
                        {hasDietPlan(date) && (
                          <div className="mt-0.5">
                            {isDietCompleted(date) ? (
                              <Check className="h-2.5 w-2.5 mx-auto text-green-500" />
                            ) : (
                              <div className="h-1 w-1 mx-auto rounded-full bg-yellow-500" />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <CardContent>
                {currentDietDay && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base font-semibold">
                        Daily Meals
                      </h2>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetDay}
                          className="h-7 px-2 text-xs"
                        >
                          Reset
                        </Button>
                        <Button
                          onClick={saveProgress}
                          disabled={isSaving}
                          size="sm"
                          className="h-7 px-2 text-xs"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {currentDietDay.meals && currentDietDay.meals.length > 0 ? (
                        currentDietDay.meals.map((meal, mealIndex) => (
                          <div key={mealIndex} className="space-y-1">
                            <div className="flex flex-row items-center justify-between gap-1 bg-muted/50 p-2 rounded-t-lg">
                              <div>
                                <h3 className="font-medium text-sm">{meal.name}</h3>
                                <p className="text-xs text-muted-foreground">{meal.time}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-medium">
                                  {getMealConsumedCalories(mealIndex)} / {meal.calories || 0} cal
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {getMealConsumedProtein(mealIndex)}g protein
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              {meal.items && meal.items.length > 0 ? (
                                meal.items.map((item, itemIndex) => (
                                  <div
                                    key={itemIndex}
                                    className={`p-2 border ${
                                      item.completed
                                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900"
                                        : "bg-card border-border"
                                    } ${itemIndex === meal.items.length - 1 ? "rounded-b-lg" : ""}`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start space-x-2">
                                        <Checkbox
                                          checked={item.completed}
                                          onCheckedChange={() => toggleMealItem(mealIndex, itemIndex)}
                                          className="mt-0.5"
                                        />
                                        <div>
                                          <p className="font-medium text-sm">{item.name}</p>
                                          <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                                            <span>{item.calories} cal</span>
                                            <span>{item.protein}g p</span>
                                            <span>{item.carbs}g c</span>
                                            <span>{item.fats}g f</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-2 rounded-b-lg border bg-muted">
                                  <p className="text-xs text-muted-foreground text-center">No meal items found</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-lg border bg-muted">
                          <p className="text-center text-muted-foreground text-sm">No meals found for this day</p>
                        </div>
                      )}
                    </div>
                    
                    {lastSaved && (
                      <p className="text-[10px] text-muted-foreground text-center mt-2">
                        Last saved: {format(lastSaved, "h:mm a")}
                        <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500" id="sync-indicator"></span>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="macros" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Nutrition Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentDietDay && (
                  <>
                    <div className="space-y-3">
                      {/* Calories */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Calories</span>
                          <span className="text-sm">
                            {getTotalConsumed().calories} / {getTargets().calories} kcal
                          </span>
                        </div>
                        <Progress 
                          value={getPercentage(getTotalConsumed().calories, getTargets().calories)} 
                          className="h-2"
                        />
                      </div>
                      
                      {/* Protein */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Protein</span>
                          <span className="text-sm">
                            {getTotalConsumed().protein} / {getTargets().protein}g
                          </span>
                        </div>
                        <Progress 
                          value={getPercentage(getTotalConsumed().protein, getTargets().protein)} 
                          className="h-2 bg-blue-100 dark:bg-blue-950"
                        />
                      </div>
                      
                      {/* Carbs */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Carbs</span>
                          <span className="text-sm">
                            {getTotalConsumed().carbs} / {getTargets().carbs}g
                          </span>
                        </div>
                        <Progress 
                          value={getPercentage(getTotalConsumed().carbs, getTargets().carbs)} 
                          className="h-2 bg-amber-100 dark:bg-amber-950"
                        />
                      </div>
                      
                      {/* Fats */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Fats</span>
                          <span className="text-sm">
                            {getTotalConsumed().fats} / {getTargets().fats}g
                          </span>
                        </div>
                        <Progress 
                          value={getPercentage(getTotalConsumed().fats, getTargets().fats)} 
                          className="h-2 bg-rose-100 dark:bg-rose-950"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <h3 className="font-medium mb-2 text-sm">Macronutrient Breakdown</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">Protein</p>
                          <p className="text-base font-bold">
                            {Math.round((getTotalConsumed().protein * 4 / Math.max(getTotalConsumed().calories, 1)) * 100)}%
                          </p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">Carbs</p>
                          <p className="text-base font-bold">
                            {Math.round((getTotalConsumed().carbs * 4 / Math.max(getTotalConsumed().calories, 1)) * 100)}%
                          </p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">Fats</p>
                          <p className="text-base font-bold">
                            {Math.round((getTotalConsumed().fats * 9 / Math.max(getTotalConsumed().calories, 1)) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <h3 className="font-medium mb-2 text-sm">Diet Plan Details</h3>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Plan:</span> {currentDietPlan.name}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Description:</span> {currentDietPlan.description}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  )
}

// Wrap the component with Suspense for client-side rendering
export default function DietPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DietPageContent />
    </Suspense>
  )
}


