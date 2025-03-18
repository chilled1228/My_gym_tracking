"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, PieChart, Calendar, ChevronLeft, ChevronRight, Check, ArrowRight, Utensils, RotateCcw, MoreHorizontal, AlertTriangle } from "lucide-react"
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
import { Meal, MealItem } from "@/lib/plan-templates"
import { useData } from "@/contexts/data-context"
import { DataSaveIndicator, useSaveStatus } from "@/components/data-save-indicator"
import { v4 as uuidv4 } from "uuid"
import type { SaveStatusCallback } from "@/lib/database"
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
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { getLocalDateString, getTodayString, dateFromLocalString } from "@/lib/utils"
import debounceImport from "lodash/debounce"

// Use imported debounce as our debounce function
const debounce = debounceImport;

interface DailyMacros {
  id?: string
  date: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

// Add new interface for tracking diet by day
interface DietDay {
  id?: string
  user_id?: string
  date: string // ISO date string
  meals: Meal[]
  completed: boolean
  created_at?: string
}

// Create a client component that uses useSearchParams
function DietPageContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<string>("meals")
  const showSyncIndicator = useSyncIndicator()
  
  // Use the data context for Supabase operations
  const { 
    getDietForDate, 
    saveDietDay, 
    saveMacros,
    getMacrosForDate
  } = useData()
  
  // Use the save status hook
  const { 
    saveStatus, 
    statusMessage, 
    setSaving, 
    setSaved, 
    setError 
  } = useSaveStatus()
  
  // Use the plan manager hook
  const { 
    currentDietPlan, 
    checkPlanDisplayConsistency,
    emergencyResetAndReload
  } = usePlanManager()
  
  // State for tracking the current date and diet
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [currentDietDay, setCurrentDietDay] = useState<DietDay | null>(null)
  const [dietHistory, setDietHistory] = useState<DietDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showWeeklyView, setShowWeeklyView] = useState(false)
  
  // Reference to track initial mount for consistency check
  const isInitialMount = { current: true };
  
  // Create a debounced version of saveDailyMacrosForDashboard
  const debouncedSaveMacros = debounce(async (meals: Meal[], date: string) => {
    try {
      await saveDailyMacrosForDashboard(meals, date);
    } catch (error) {
      console.error('Error in debounced macro save:', error);
    }
  }, 1000);
  
  // Check plan display consistency on mount but don't repeat excessively
  useEffect(() => {
    if (isInitialMount.current) {
      // Only do consistency check on initial mount, not on rerenders
      console.log("Initial mount - checking plan display consistency");
      checkPlanDisplayConsistency();
      isInitialMount.current = false;
    }
  }, [checkPlanDisplayConsistency]);
  
  // Load diet history on mount
  useEffect(() => {
    const loadDietData = async () => {
      setIsLoading(true)
      try {
        // Get today's date string using our timezone-aware function
        const todayString = getTodayString();
        
        // Try to get today's diet from Supabase
        const dietDayFromSupabase = await getDietForDate(todayString);
        
        if (dietDayFromSupabase) {
          // If we have a diet for today, set it as current
          // Convert to our local DietDay type if needed
          const dietDay: DietDay = {
            id: dietDayFromSupabase.id,
            user_id: dietDayFromSupabase.user_id,
            date: dietDayFromSupabase.date,
            meals: dietDayFromSupabase.meals as Meal[],
            completed: dietDayFromSupabase.completed,
            created_at: dietDayFromSupabase.created_at
          };
          
          setCurrentDietDay(dietDay);
          
          // Add to diet history if not already there
          setDietHistory(prev => {
            const exists = prev.some(d => d.date === todayString);
            if (!exists) {
              return [...prev, dietDay];
            }
            return prev;
          });
        } else if (currentDietPlan) {
          // If no diet for today but we have a plan, create a new one
          createNewDietDay(todayString);
        }
        
        setCurrentDate(new Date());
      } catch (error) {
        console.error("Error loading diet data:", error);
        toast({
          title: "Error",
          description: "Failed to load diet data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDietData();
    
    // Set active tab from URL if present
    if (tabParam) {
      setActiveTab(tabParam)
    }
    
    // Calculate streak
    calculateStreak()
  }, [tabParam, getDietForDate, currentDietPlan])
  
  // Force refresh macroHistory data when the page loads
  useEffect(() => {
    // If we have a current diet day, force refresh the macroHistory data
    if (currentDietDay && currentDietDay.meals) {
      // Create a unique key for the currentDietDay to prevent multiple identical saves
      const dietKey = `${currentDietDay.id || ''}-${currentDietDay.date}`;
      
      // Use the debounced version to prevent too many saves
      debouncedSaveMacros(currentDietDay.meals, currentDietDay.date);
    }
  }, [currentDietDay?.id, currentDietDay?.date]); // Only re-run when ID or date changes
  
  // Add a ref to track if we're already loading a specific date
  const loadingDateRef = useRef<string | null>(null);

  // Update current diet when date changes or diet history changes
  useEffect(() => {
    // Skip if we don't have a diet plan yet
    if (!currentDietPlan) return;
    
    const dateString = getLocalDateString(currentDate);
    
    // Skip if we're already loading this date
    if (loadingDateRef.current === dateString) {
      return;
    }
    
    const loadDietForDate = async () => {
      // Set the ref to the current date we're loading
      loadingDateRef.current = dateString;
      
      setIsLoading(true);
      try {
        // Use timezone-aware function for date string
        console.log("Loading diet for date:", dateString);
        
        // Validate date format - should be YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          console.error(`Invalid date format: ${dateString}. Expected YYYY-MM-DD.`);
          createNewDietDay(getTodayString());
          setIsLoading(false);
          loadingDateRef.current = null;
          return;
        }
        
        // Prevent loading future dates
        const dateObj = new Date(dateString);
        const now = new Date();
        if (dateObj > now) {
          console.warn(`Future date detected in loadDietForDate: ${dateString}. Using today's date instead.`);
          // Reset to today and exit the function
          setCurrentDate(new Date());
          toast({
            title: "Cannot View Future",
            description: "Future dates are not available. Showing today instead.",
            variant: "destructive",
          });
          setIsLoading(false);
          loadingDateRef.current = null;
          return;
        }
        
        // Try to get diet from Supabase first
        const dietFromSupabase = await getDietForDate(dateString);
        
        if (dietFromSupabase) {
          console.log("Found diet in Supabase for date:", dateString);
          
          // Convert to our local DietDay type if needed
          const dietDay: DietDay = {
            id: dietFromSupabase.id,
            user_id: dietFromSupabase.user_id,
            date: dietFromSupabase.date,
            meals: dietFromSupabase.meals as Meal[],
            completed: dietFromSupabase.completed,
            created_at: dietFromSupabase.created_at
          };
          
          setCurrentDietDay(dietDay);
          
          // Update local history
          setDietHistory(prev => {
            const exists = prev.some(d => d.date === dateString);
            if (!exists) {
              return [...prev, dietDay];
            }
            return prev.map(d => d.date === dateString ? dietDay : d);
          });
        } else {
          // Check local history as fallback
          const existingDiet = dietHistory.find(
            (diet) => diet.date === dateString
          );
          
          if (existingDiet) {
            console.log("Found existing diet in local history for date:", dateString);
            setCurrentDietDay(existingDiet);
          } else {
            console.log("No existing diet found for date:", dateString, "creating new");
            // Create a new diet day based on the current plan
            createNewDietDay(dateString);
          }
        }
      } catch (error) {
        console.error("Error loading diet for date:", error);
        toast({
          title: "Error",
          description: "Failed to load diet data for the selected date.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDietForDate();
  }, [currentDate, currentDietPlan]);
  
  // Create a new diet day for the current date
  const createNewDietDay = (dateString: string) => {
    if (!currentDietPlan || !currentDietPlan.meals) {
      console.error("Cannot create new diet day: no current diet plan or meals");
      return;
    }
    
    // Create a deep copy of the meals from the current diet plan
    const newMeals = JSON.parse(JSON.stringify(currentDietPlan.meals)) as Meal[];
    
    // Create a new diet day with the copied meals
    const newDietDay: DietDay = {
      id: uuidv4(), // Generate a new ID for the diet day
      date: dateString,
      meals: newMeals,
      completed: false,
    };
    
    // Update state
    setCurrentDietDay(newDietDay);
    
    // Update diet history
    updateDietHistory(newMeals, dateString);
    
    return newDietDay;
  };
  
  // Navigate to a specific date
  const navigateToDate = (date: Date) => {
    // Use our new date validation handler
    handleDateChange(date);
    
    // The rest of the logic will run after setCurrentDate is called
    const dateString = getLocalDateString(date);
    
    // Check if we already have diet data for this date
    const existingDiet = dietHistory.find(
      (diet) => diet.date === dateString
    );
    
    if (existingDiet) {
      setCurrentDietDay(existingDiet)
    } else {
      // Create a new diet day based on the current plan
      createNewDietDay(dateString)
    }
  }
  
  const goToPreviousDay = () => {
    const previousDay = new Date(currentDate)
    previousDay.setDate(previousDay.getDate() - 1)
    navigateToDate(previousDay)
  }
  
  const goToNextDay = () => {
    const nextDay = new Date(currentDate)
    nextDay.setDate(nextDay.getDate() + 1)
    
    // Don't allow navigation to future dates
    const now = new Date()
    if (nextDay > now) {
      toast({
        title: "Cannot Navigate to Future",
        description: "You cannot view future dates.",
        variant: "destructive",
      })
      return
    }
    
    navigateToDate(nextDay)
  }
  
  const moveToNextWeek = () => {
    const nextWeek = addWeeks(currentDate, 1)
    
    // Don't allow navigation to future dates
    const now = new Date()
    if (nextWeek > now) {
      toast({
        title: "Cannot Navigate to Future",
        description: "You cannot view future dates.",
        variant: "destructive",
      })
      return
    }
    
    navigateToDate(nextWeek)
  }
  
  // Meal interaction functions
  const toggleMealItem = (mealIndex: number, itemIndex: number) => {
    if (!currentDietDay || !currentDietDay.meals) return;
    
    // Create a deep copy of the current diet day
    const updatedDietDay = JSON.parse(JSON.stringify(currentDietDay)) as DietDay;
    
    // Toggle the completed status of the meal item
    if (updatedDietDay.meals[mealIndex] && 
        updatedDietDay.meals[mealIndex].items && 
        updatedDietDay.meals[mealIndex].items[itemIndex]) {
      
      updatedDietDay.meals[mealIndex].items[itemIndex].completed = 
        !updatedDietDay.meals[mealIndex].items[itemIndex].completed;
      
      // Update the current diet day
      setCurrentDietDay(updatedDietDay);
      
      // Update diet history
      updateDietHistory(updatedDietDay.meals);
      
      // Auto-save to Supabase
      try {
        autoSaveDietProgress(updatedDietDay.meals).catch(error => {
          console.error("Error in autoSaveDietProgress from toggleMealItem:", error);
        });
      } catch (error) {
        console.error("Error calling autoSaveDietProgress:", error);
      }
    }
  };
  
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
    try {
      autoSaveDietProgress(validatedMeals, currentDietDay.date).catch(error => {
        console.error("Error in autoSaveDietProgress from updateCurrentDietDay:", error);
      });
    } catch (error) {
      console.error("Error calling autoSaveDietProgress:", error);
    }
    
    // Update current diet day
    setCurrentDietDay(updatedDietDay);
  }
  
  const updateDietHistory = (meals: Meal[], dateOverride?: string) => {
    const dateString = dateOverride || getLocalDateString(currentDate);
    
    // Check if we already have an entry for this date
    const existingIndex = dietHistory.findIndex(
      (diet) => diet.date === dateString
    );
    
    let updatedHistory = [...dietHistory];
    
    // Calculate if all meal items are completed
    const allCompleted = meals.every((meal) => 
      meal.items.every((item) => item.completed)
    );
    
    if (existingIndex !== -1) {
      // Update existing entry
      updatedHistory[existingIndex] = {
        ...updatedHistory[existingIndex],
        meals,
        completed: allCompleted,
      };
    } else {
      // Add new entry
      updatedHistory.push({
        date: dateString,
        meals,
        completed: allCompleted,
      });
    }
    
    // Update state
    setDietHistory(updatedHistory);
    
    // Update current diet day if it's the current date
    if (dateString === getLocalDateString(currentDate)) {
      setCurrentDietDay({
        date: dateString,
        meals,
        completed: allCompleted,
      });
    }
    
    return updatedHistory;
  };
  
  // Auto-save diet progress when meals change
  useEffect(() => {
    // Skip if there's no current diet day or if it's the initial render
    if (!currentDietDay || !currentDietDay.meals) return;
    
    // Use a ref to track if this is from a user action vs. an automatic update
    const timeoutId = setTimeout(() => {
      // Auto-save progress
      const dateString = currentDietDay.date;
      const validatedMeals = currentDietDay.meals.map(meal => {
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
      
      // Update state with the new history without triggering the dietHistory useEffect
      if (JSON.stringify(newDietHistory) !== JSON.stringify(dietHistory)) {
        setDietHistory(newDietHistory);
      }
      
      // Save daily macros for dashboard
      try {
        // Use promise-based handling with explicit error management
        saveDailyMacrosForDashboard(validatedMeals, dateString)
          .then(result => {
            if (!result) {
              console.warn("Failed to save macros in useEffect, but meals were processed successfully");
            }
          })
          .catch(error => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Error saving macros in useEffect:", errorMessage, error);
          });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Exception when trying to save macros in useEffect:", errorMessage, error);
      }
      
      // Update last saved timestamp
      setLastSaved(new Date());
      showSyncIndicator();
    }, 500); // Debounce for 500ms
    
    return () => clearTimeout(timeoutId);
  }, [currentDietDay?.meals]);
  
  // Save diet history to localStorage whenever it changes - but don't update state again
  useEffect(() => {
    if (dietHistory.length === 0) return;
    
    // Only save to localStorage, don't update any state that would trigger re-renders
    const timeoutId = setTimeout(() => {
      safeSetItem("dietHistory", dietHistory);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [dietHistory]);
  
  // Save daily macros for dashboard
  const saveDailyMacrosForDashboard = async (meals: Meal[], dateString: string) => {
    try {
      // Validate inputs
      if (!meals) {
        console.error("No meals data provided");
        return false; // Return false instead of throwing
      }
      
      if (!Array.isArray(meals)) {
        console.error("Invalid meals data: not an array", typeof meals);
        return false; // Return false instead of throwing
      }
      
      if (!dateString) {
        console.error("No date string provided");
        return false; // Return false instead of throwing
      }
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        console.error(`Invalid date format: ${dateString}. Expected YYYY-MM-DD`);
        return false; // Return false instead of throwing
      }
      
      // Validate that the date is not in the future
      const dateObj = new Date(dateString);
      const now = new Date();
      if (dateObj > now) {
        console.warn(`Future date detected in saveDailyMacrosForDashboard: ${dateString}. Skipping save.`);
        return false; // Skip saving for future dates
      }
      
      // Check if there are any completed items
      let hasCompletedItems = false;
      for (const meal of meals) {
        if (meal && Array.isArray(meal.items)) {
          for (const item of meal.items) {
            if (item && item.completed) {
              hasCompletedItems = true;
              break;
            }
          }
        }
        if (hasCompletedItems) break;
      }
      
      if (!hasCompletedItems) {
        console.log("No completed meal items found, skipping macros save");
        return true;
      }
      
      // Calculate total macros from meals
      const totalMacros = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      };
      
      // Only count completed items
      meals.forEach((meal) => {
        if (!meal || !Array.isArray(meal.items)) return;
        
        meal.items.forEach((item) => {
          if (item && item.completed) {
            totalMacros.calories += Number(item.calories) || 0;
            totalMacros.protein += Number(item.protein) || 0;
            totalMacros.carbs += Number(item.carbs) || 0;
            totalMacros.fats += Number(item.fats) || 0;
          }
        });
      });
      
      // Create the daily macros object with rounded values
      const dailyMacros = {
        id: uuidv4(),
        date: dateString,
        calories: Math.round(totalMacros.calories),
        protein: Math.round(totalMacros.protein),
        carbs: Math.round(totalMacros.carbs),
        fats: Math.round(totalMacros.fats),
      };
      
      // Log the macros being saved for debugging
      console.log("Saving daily macros:", dailyMacros);
      
      // Skip saving if all values are zero
      if (dailyMacros.calories === 0 && 
          dailyMacros.protein === 0 && 
          dailyMacros.carbs === 0 && 
          dailyMacros.fats === 0) {
        console.log("Skipping save for empty macros");
        return true; // Return true to indicate "success" (nothing to save)
      }
      
      // Save to Supabase
      const result = await saveMacros(dailyMacros, {
        onSaving: () => {
          console.log("Saving macros to Supabase...");
        },
        onSuccess: () => {
          console.log("Macros saved to Supabase successfully");
        },
        onError: (error) => {
          // Provide more detailed error logging
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorDetails = error instanceof Error && (error as any).originalError 
            ? JSON.stringify((error as any).originalError) 
            : 'No details available';
            
          console.error("Error saving macros to Supabase:", errorMessage);
          console.error("Error details:", errorDetails);
          
          // Don't re-throw the error to prevent unhandled promise rejections
        }
      });
      
      return result;
    } catch (error) {
      // Provide more detailed error logging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = error instanceof Error && (error as any).originalError 
        ? JSON.stringify((error as any).originalError) 
        : 'No details available';
        
      console.error("Exception in saveDailyMacrosForDashboard:", errorMessage);
      console.error("Error details:", errorDetails);
      
      // Return false to indicate failure but don't throw to prevent unhandled promise rejections
      return false;
    }
  };
  
  // Calculate streak based on diet history
  const calculateStreak = () => {
    if (!Array.isArray(dietHistory) || dietHistory.length === 0) {
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Sort history by date (newest first)
    const sortedHistory = [...dietHistory].sort((a, b) => {
      if (!a || !a.date || !b || !b.date) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }).filter(item => item && item.date); // Filter out any invalid entries
    
    if (sortedHistory.length === 0) {
      return;
    }
    
    // Check if there's a diet entry for today
    const todayStr = today.toISOString().split('T')[0];
    const hasTodayEntry = sortedHistory.some(
      (entry) => entry && entry.date === todayStr && entry.completed
    );
    
    // Update the diet history with the streak information
    safeSetItem("dietHistory", dietHistory);
  }

  // Update the autoSaveDietProgress function to save to Supabase
  const autoSaveDietProgress = async (meals: Meal[], dateOverride?: string) => {
    const dateString = dateOverride || getLocalDateString(currentDate);
    
    // Validate inputs
    if (!Array.isArray(meals)) {
      console.error("Meals is not an array in autoSaveDietProgress:", meals);
      return false;
    }
    
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      console.error("Invalid date format in autoSaveDietProgress:", dateString);
      return false;
    }
    
    // Validate that the date is not in the future
    const dateObj = new Date(dateString);
    const now = new Date();
    if (dateObj > now) {
      console.warn(`Future date detected in autoSaveDietProgress: ${dateString}. Skipping save.`);
      return false; // Skip saving for future dates
    }
    
    // Update diet history first
    const updatedHistory = updateDietHistory(meals, dateString);
    
    // Calculate if all meal items are completed
    const allCompleted = meals.every((meal) => 
      meal && meal.items && Array.isArray(meal.items) && meal.items.every((item) => item && item.completed)
    );
    
    // Create the diet day object to save
    const dietDayToSave: DietDay = {
      id: currentDietDay?.id || uuidv4(),
      date: dateString,
      meals,
      completed: allCompleted,
    };
    
    console.log("Auto-saving diet day:", {
      id: dietDayToSave.id,
      date: dietDayToSave.date,
      meals: `${dietDayToSave.meals.length} meals`,
      completed: dietDayToSave.completed
    });
    
    try {
      // Save to Supabase without showing UI indicators
      await saveDietDay(dietDayToSave, {
        onSuccess: () => {
          // Update last saved time
          setLastSaved(new Date());
          
          // Also save the macros for the dashboard
          try {
            // Use promise-based handling with explicit error management
            saveDailyMacrosForDashboard(meals, dateString)
              .then(result => {
                if (!result) {
                  console.warn("Failed to save macros in autoSaveDietProgress, but diet data was saved successfully");
                }
              })
              .catch(error => {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const errorDetails = error instanceof Error && (error as any).originalError 
                  ? JSON.stringify((error as any).originalError) 
                  : 'No details available';
                  
                console.error("Error saving macros in autoSaveDietProgress:", errorMessage);
                console.error("Error details:", errorDetails);
              });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorDetails = error instanceof Error && (error as any).originalError 
              ? JSON.stringify((error as any).originalError) 
              : 'No details available';
              
            console.error("Exception when trying to save macros in autoSaveDietProgress:", errorMessage);
            console.error("Error details:", errorDetails);
          }
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorDetails = error instanceof Error && (error as any).originalError 
            ? JSON.stringify((error as any).originalError) 
            : 'No details available';
            
          console.error("Error auto-saving diet progress:", errorMessage);
          console.error("Error details:", errorDetails);
        }
      });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = error instanceof Error && (error as any).originalError 
        ? JSON.stringify((error as any).originalError) 
        : 'No details available';
        
      console.error("Exception in autoSaveDietProgress:", errorMessage);
      console.error("Error details:", errorDetails);
      return false;
    }
  };
  
  const handleDateChange = (date: Date | undefined) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.error("Invalid date selected:", date);
      return;
    }
    
    // Don't allow future dates
    const now = new Date();
    if (date > now) {
      console.warn("Future date selected, defaulting to today");
      setCurrentDate(new Date());
      return;
    }
    
    // Set the date if it's valid
    setCurrentDate(date);
  };
  
  // React to diet plan changes
  useEffect(() => {
    console.log("Diet plan changed to:", currentDietPlan?.name);
    
    if (!currentDietPlan) return;
    
    // Skip if this is NOT the initial render (we only want to run this on first change)
    if (!isInitialMount.current) {
      const dateString = getLocalDateString(currentDate);
      const existingDiet = dietHistory.find((diet) => diet.date === dateString);
      
      if (existingDiet) {
        console.log("Found existing diet progress for today, using it instead of creating new");
        setCurrentDietDay(existingDiet);
      } else {
        console.log("No existing diet progress found, creating new diet day");
        createNewDietDay(dateString);
      }
    }
    
  }, [currentDietPlan, currentDate, dietHistory]);
  
  // Update saveProgress to use debounced macro save
  const saveProgress = async () => {
    if (!currentDietPlan || !currentDate || !currentDietDay) {
      toast({
        title: "No Diet Plan Available",
        description: "There is no diet plan to save for this date.",
        variant: "destructive",
      });
      return;
    }
    
    setSaving();
    
    try {
      const dietDayToSave: DietDay = {
        ...currentDietDay,
        id: currentDietDay.id || uuidv4(),
      };
      
      // Validation checks...
      
      const success = await saveDietDay(dietDayToSave, {
        onSaving: () => {},
        onSuccess: () => {
          setSaved("Diet progress saved to Supabase");
          setLastSaved(new Date());
          
          // Use debounced macro save
          if (dietDayToSave.meals && dietDayToSave.date) {
            debouncedSaveMacros(dietDayToSave.meals, dietDayToSave.date);
          }
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(`Failed to save diet progress: ${errorMessage}`);
          console.error("Error saving diet day:", error);
          toast({
            title: "Error",
            description: "Failed to save diet progress. Please try again.",
            variant: "destructive",
          });
        }
      });
      
      if (!success) {
        setError("Failed to save diet progress");
        toast({
          title: "Error",
          description: "Failed to save diet progress. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Error: ${errorMessage}`);
      console.error("Exception in saveProgress:", error);
      toast({
        title: "Error",
        description: `Failed to save diet progress: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };
  
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
    // Calculate the new date
    const newDate = direction === 'prev' 
      ? addWeeks(currentDate, -1)
      : addWeeks(currentDate, 1)
    
    // Don't allow navigation to future dates
    const now = new Date()
    if (direction === 'next' && newDate > now) {
      toast({
        title: "Cannot Navigate to Future",
        description: "You cannot view future dates.",
        variant: "destructive",
      })
      return
    }
    
    navigateToDate(newDate)
  }
  
  const getDayData = (date: Date) => {
    const dateString = getLocalDateString(date)
    const dietDay = dietHistory.find(day => day.date === dateString)
    
    return {
      hasDiet: !!dietDay,
      isCompleted: dietDay?.completed || false
    }
  }
  
  const isToday = (date: Date) => {
    return getLocalDateString(date) === getTodayString();
  }
  
  const hasDietPlan = (date: Date) => {
    const dateString = getLocalDateString(date)
    return dietHistory.some((diet) => diet.date === dateString)
  }
  
  const isDietCompleted = (date: Date) => {
    const dateString = getLocalDateString(date)
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
  
  const resetDay = () => {
    // Create a new diet day based on the current plan
    const dateString = getLocalDateString(currentDate);
    
    // Update diet history by removing the entry for the current date
    const updatedHistory = dietHistory.filter(
      (diet) => diet.date !== dateString
    );
    
    // Update macro history by removing the entry for the current date
    const macroHistory = safeGetItem<DailyMacros[]>("macroHistory", []);
    const updatedMacroHistory = macroHistory.filter(
      (macro) => macro.date !== dateString
    );
    
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
    setDietHistory(updatedHistory);
    
    // Create a new diet day after updating the history
    setTimeout(() => {
      createNewDietDay(dateString);
    }, 0);
    
    // Show success toast
    toast({
      title: "Day Reset",
      description: "Your diet for today has been reset to the plan default.",
    });
  };
  
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
                      const dateString = getLocalDateString(currentDate)
                      
                      // Update diet history by removing the entry for the current date
                      const updatedHistory = dietHistory.filter(
                        (diet) => diet.date !== dateString
                      )
                      
                      // Update state
                      setDietHistory(updatedHistory)
                      
                      // Create a new diet day for the current date
                      createNewDietDay(dateString)
                      
                      toast({
                        title: "Reset Complete",
                        description: "Diet progress for today has been reset.",
                      })
                    }}
                  >
                    Reset Today's Progress
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Date Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousDay}
              disabled={isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium">
                {formatCurrentDate(currentDate)}
              </span>
              {isToday(currentDate) && (
                <span className="text-xs text-primary">Today</span>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextDay}
              disabled={isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          {/* Save Status Indicator */}
          <div className="flex items-center justify-between mb-2">
            <DataSaveIndicator status={saveStatus} message={statusMessage} />
            
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-muted-foreground">
                  Last saved: {format(lastSaved, 'h:mm a')}
                </span>
              )}
              
              <Button
                variant="default"
                size="sm"
                onClick={saveProgress}
                disabled={isLoading || saveStatus === "saving"}
                className="gap-1"
              >
                <Save className="h-4 w-4" />
                Save
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
                          key={getLocalDateString(date)}
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
                            disabled={isLoading || saveStatus === "saving"}
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
                      
                      <div className="mt-4 p-3 rounded-lg bg-muted">
                        <h3 className="text-sm font-medium mb-2">Macronutrient Breakdown</h3>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-xs text-muted-foreground">Protein</div>
                            <div className="text-sm font-medium">
                              {Math.round((getTotalConsumed().protein * 4 / Math.max(getTotalConsumed().calories, 1)) * 100 || 0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Carbs</div>
                            <div className="text-sm font-medium">
                              {Math.round((getTotalConsumed().carbs * 4 / Math.max(getTotalConsumed().calories, 1)) * 100 || 0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Fats</div>
                            <div className="text-sm font-medium">
                              {Math.round((getTotalConsumed().fats * 9 / Math.max(getTotalConsumed().calories, 1)) * 100 || 0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
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


