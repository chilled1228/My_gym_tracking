"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Save, Plus, Minus, History, Check, ChevronLeft, ChevronRight, ArrowRight, RefreshCw, Calendar, HelpCircle, Trophy, Info, CheckCircle, Circle, Dumbbell, BarChart, CalendarDays, MoreHorizontal, RotateCcw, AlertTriangle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MobileLayout } from "@/components/mobile-layout"
import { safeGetItem, safeSetItem } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useSyncIndicator } from "@/hooks/use-sync-indicator"
import { format, addWeeks, startOfWeek, isAfter, isBefore, startOfDay, isSameDay } from "date-fns"
import { usePlanManager } from "@/hooks/use-plan-manager"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Define workout-related interfaces
interface Exercise {
  name: string
  sets: string
  reps: number
  completed: boolean
  tooltip?: string
}

interface WorkoutDay {
  name: string
  exercises: Exercise[]
}

// New interface for tracking workouts by date
interface DatedWorkout {
  date: string // ISO date string
  workout: WorkoutDay
  completed: boolean
}

export default function WorkoutPage() {
  const { toast } = useToast()
  const showSyncIndicator = useSyncIndicator()
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showWeeklyView, setShowWeeklyView] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(0)
  
  // Use the plan manager hook
  const { 
    currentWorkoutPlan, 
    checkPlanDisplayConsistency,
    emergencyResetAndReload,
    deleteAllWorkoutPlans
  } = usePlanManager()
  
  // State for tracking the current date and workout
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [currentDatedWorkout, setCurrentDatedWorkout] = useState<DatedWorkout | null>(null)
  const [workoutHistory, setWorkoutHistory] = useState<DatedWorkout[]>([])
  
  // Check plan display consistency on mount
  useEffect(() => {
    // Ensure the workout plan is displayed correctly
    checkPlanDisplayConsistency();
  }, [checkPlanDisplayConsistency]);
  
  // Load workout history on mount
  useEffect(() => {
    const savedHistory = safeGetItem("workoutHistory", [])
    if (savedHistory && Array.isArray(savedHistory)) {
      setWorkoutHistory(savedHistory)
    }
    
    // Calculate streak
    calculateStreak()
  }, [])
  
  // Update current workout when date changes
  useEffect(() => {
    try {
      if (!currentWorkoutPlan || 
          !currentWorkoutPlan.days || 
          !Array.isArray(currentWorkoutPlan.days) || 
          !currentWorkoutPlan.days.length) {
        console.warn("No valid workout plan available");
        return;
      }
      
      const dateString = currentDate.toISOString().split('T')[0]
      const existingWorkout = workoutHistory.find(
        (workout) => workout && workout.date === dateString
      )
      
      if (existingWorkout) {
        setCurrentDatedWorkout(existingWorkout)
      } else {
        // Get the day of the week (0-6, where 0 is Sunday)
        const dayIndex = currentDate.getDay()
        // Adjust to make Monday index 0 (for workout plans that start on Monday)
        const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1
        
        // Create a new workout day based on the current plan
        createNewWorkoutDay(dateString, adjustedDayIndex)
      }
    } catch (error) {
      console.error("Error updating current workout:", error);
      toast({
        title: "Error Loading Workout",
        description: "There was an error loading the workout for this date.",
        variant: "destructive",
      });
    }
  }, [currentDate, workoutHistory, currentWorkoutPlan])
  
  // Create a new workout day for the current date
  const createNewWorkoutDay = (dateString: string, dayIndex: number) => {
    // Make sure we have a valid workout plan
    if (!currentWorkoutPlan || 
        !currentWorkoutPlan.days || 
        !Array.isArray(currentWorkoutPlan.days) || 
        !currentWorkoutPlan.days.length) {
      console.error("No valid workout plan available");
      toast({
        title: "Error",
        description: "No valid workout plan available. Please select a plan.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Get the workout day from the current plan based on the day index
      // If the day index is out of bounds, use the first day
      const planDayIndex = dayIndex % currentWorkoutPlan.days.length
      const workoutDay = JSON.parse(JSON.stringify(currentWorkoutPlan.days[planDayIndex] || currentWorkoutPlan.days[0]))
      
      // Ensure the workout day has the required properties
      if (!workoutDay.exercises) {
        workoutDay.exercises = []
      }
      
      if (!workoutDay.name) {
        workoutDay.name = `Day ${planDayIndex + 1}`
      }
      
      const newDatedWorkout: DatedWorkout = {
        date: dateString,
        workout: workoutDay,
        completed: false,
      }
      
      setCurrentDatedWorkout(newDatedWorkout)
    } catch (error) {
      console.error("Error creating new workout day:", error)
      toast({
        title: "Error",
        description: "Failed to create a new workout day. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  // Navigation functions
  const navigateToDate = (date: Date, dayIndex?: number) => {
    const dateString = date.toISOString().split('T')[0]
    const existingWorkout = workoutHistory.find(
      (workout) => workout.date === dateString
    )
    
    if (existingWorkout) {
      setCurrentDatedWorkout(existingWorkout)
    } else if (dayIndex !== undefined) {
      createNewWorkoutDay(dateString, dayIndex)
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
  
  // Helper functions
  const formatCurrentDate = (date: Date) => {
    return format(date, "EEEE, MMMM d, yyyy")
  }
  
  const isToday = (date: Date) => {
    const today = new Date()
    return isSameDay(date, today)
  }
  
  const calculateStreak = () => {
    if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) {
      setCurrentStreak(0)
      return
    }
    
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Sort history by date (newest first)
    const sortedHistory = [...workoutHistory].sort((a, b) => {
      if (!a || !a.date || !b || !b.date) return 0
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }).filter(item => item && item.date) // Filter out any invalid entries
    
    if (sortedHistory.length === 0) {
      setCurrentStreak(0)
      return
    }
    
    // Check if there's a workout for today
    const todayStr = today.toISOString().split('T')[0]
    const hasTodayWorkout = sortedHistory.some(
      (workout) => workout && workout.date === todayStr && workout.completed
    )
    
    // If no workout for today, check if there's one for yesterday
    if (!hasTodayWorkout) {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      const hasYesterdayWorkout = sortedHistory.some(
        (workout) => workout && workout.date === yesterdayStr && workout.completed
      )
      
      // If no workout for yesterday either, streak is 0
      if (!hasYesterdayWorkout) {
        setCurrentStreak(0)
        return
      }
    }
    
    // Calculate streak by checking consecutive days
    let currentDate = new Date(today)
    let dateStr = currentDate.toISOString().split('T')[0]
    
    // If today's workout is completed, include it in the streak
    if (hasTodayWorkout) {
      streak = 1
      currentDate.setDate(currentDate.getDate() - 1)
      dateStr = currentDate.toISOString().split('T')[0]
    }
    
    // Check previous days
    while (true) {
      const workoutForDate = sortedHistory.find(
        (workout) => workout && workout.date === dateStr
      )
      
      if (workoutForDate && workoutForDate.completed) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
        dateStr = currentDate.toISOString().split('T')[0]
      } else {
        break
      }
    }
    
    setCurrentStreak(streak)
  }
  
  // Workout interaction functions
  const toggleExercise = (exerciseIndex: number) => {
    if (!currentDatedWorkout || 
        !currentDatedWorkout.workout || 
        !currentDatedWorkout.workout.exercises || 
        !Array.isArray(currentDatedWorkout.workout.exercises) ||
        exerciseIndex < 0 || 
        exerciseIndex >= currentDatedWorkout.workout.exercises.length ||
        !currentDatedWorkout.workout.exercises[exerciseIndex]) {
      console.error("Cannot toggle exercise: Invalid data or index");
      return;
    }
    
    const updatedWorkout = { ...currentDatedWorkout }
    updatedWorkout.workout.exercises[exerciseIndex].completed = 
      !updatedWorkout.workout.exercises[exerciseIndex].completed
    
    // Check if all exercises are completed
    const allCompleted = updatedWorkout.workout.exercises.every(
      (exercise) => exercise && exercise.completed
    )
    updatedWorkout.completed = allCompleted
    
    // If all exercises are completed and it wasn't completed before, show completion dialog
    if (allCompleted && !currentDatedWorkout.completed) {
      setShowCompletionDialog(true)
    }
    
    setCurrentDatedWorkout(updatedWorkout)
    updateCurrentDatedWorkout(updatedWorkout.workout)
  }
  
  const updateReps = (exerciseIndex: number, value: number) => {
    if (!currentDatedWorkout || 
        !currentDatedWorkout.workout || 
        !currentDatedWorkout.workout.exercises || 
        !Array.isArray(currentDatedWorkout.workout.exercises) ||
        exerciseIndex < 0 || 
        exerciseIndex >= currentDatedWorkout.workout.exercises.length ||
        !currentDatedWorkout.workout.exercises[exerciseIndex]) {
      console.error("Cannot update reps: Invalid data or index");
      return;
    }
    
    const updatedWorkout = { ...currentDatedWorkout }
    updatedWorkout.workout.exercises[exerciseIndex].reps = value
    
    setCurrentDatedWorkout(updatedWorkout)
    updateCurrentDatedWorkout(updatedWorkout.workout)
  }
  
  const incrementReps = (exerciseIndex: number) => {
    if (!currentDatedWorkout || 
        !currentDatedWorkout.workout || 
        !currentDatedWorkout.workout.exercises || 
        !Array.isArray(currentDatedWorkout.workout.exercises) ||
        exerciseIndex < 0 || 
        exerciseIndex >= currentDatedWorkout.workout.exercises.length ||
        !currentDatedWorkout.workout.exercises[exerciseIndex]) {
      console.error("Cannot increment reps: Invalid data or index");
      return;
    }
    
    const updatedWorkout = { ...currentDatedWorkout }
    updatedWorkout.workout.exercises[exerciseIndex].reps += 1
    
    setCurrentDatedWorkout(updatedWorkout)
    updateCurrentDatedWorkout(updatedWorkout.workout)
  }
  
  const decrementReps = (exerciseIndex: number) => {
    if (!currentDatedWorkout || 
        !currentDatedWorkout.workout || 
        !currentDatedWorkout.workout.exercises || 
        !Array.isArray(currentDatedWorkout.workout.exercises) ||
        exerciseIndex < 0 || 
        exerciseIndex >= currentDatedWorkout.workout.exercises.length ||
        !currentDatedWorkout.workout.exercises[exerciseIndex] ||
        currentDatedWorkout.workout.exercises[exerciseIndex].reps <= 0) {
      console.error("Cannot decrement reps: Invalid data, index, or already at 0");
      return;
    }
    
    const updatedWorkout = { ...currentDatedWorkout }
    updatedWorkout.workout.exercises[exerciseIndex].reps -= 1
    
    setCurrentDatedWorkout(updatedWorkout)
    updateCurrentDatedWorkout(updatedWorkout.workout)
  }
  
  // Update functions
  const updateCurrentDatedWorkout = (workout: WorkoutDay) => {
    if (!currentDatedWorkout || !workout || !workout.exercises || !Array.isArray(workout.exercises)) {
      console.error("Cannot update workout: Invalid data");
      return;
    }
    
    // Check if all exercises are completed
    const allCompleted = workout.exercises.every((exercise) => exercise && exercise.completed)
    
    const updatedDatedWorkout: DatedWorkout = {
      ...currentDatedWorkout,
      workout,
      completed: allCompleted,
    }
    
    // Update workout history
    updateWorkoutHistory(workout)
    
    // Auto-save progress
    autoSaveWorkoutProgress(workout)
  }
  
  const autoSaveWorkoutProgress = (workout: WorkoutDay) => {
    if (!currentDatedWorkout || !workout || !workout.exercises || !Array.isArray(workout.exercises)) {
      console.error("Cannot save workout progress: Invalid data");
      return;
    }
    
    // Create a copy of the current workout history
    const updatedHistory = [...workoutHistory];
    const existingIndex = updatedHistory.findIndex(
      (item) => item && item.date === currentDatedWorkout.date
    );
    
    // Check if all exercises are completed
    const allCompleted = workout.exercises.every((exercise) => exercise && exercise.completed);
    
    // Create a new workout history array
    let newWorkoutHistory: DatedWorkout[];
    
    if (existingIndex >= 0) {
      // Update existing entry
      newWorkoutHistory = updatedHistory.map(item => 
        item.date === currentDatedWorkout.date
          ? { ...item, workout, completed: allCompleted }
          : item
      );
    } else {
      // Add new entry
      newWorkoutHistory = [
        ...updatedHistory,
        {
          date: currentDatedWorkout.date,
          workout,
          completed: allCompleted,
        }
      ];
    }
    
    // Save with data cleanup options
    safeSetItem("workoutHistory", newWorkoutHistory, {
      maxItems: 90, // Keep data for last 90 days
      maxAge: 90,   // Remove entries older than 90 days
      validateFn: (item) => {
        // Validate that the item has all required properties
        return item && 
               typeof item.date === 'string' && 
               item.workout && 
               Array.isArray(item.workout.exercises) &&
               typeof item.completed === 'boolean';
      }
    });
    
    // Update state
    setWorkoutHistory(newWorkoutHistory);
    
    setLastSaved(new Date());
    showSyncIndicator();
  }
  
  const updateWorkoutHistory = (workout: WorkoutDay) => {
    if (!currentDatedWorkout || !workout || !workout.exercises || !Array.isArray(workout.exercises)) {
      console.error("Cannot update workout history: Invalid data");
      return;
    }
    
    const updatedHistory = [...workoutHistory]
    const existingIndex = updatedHistory.findIndex(
      (item) => item && item.date === currentDatedWorkout.date
    )
    
    // Check if all exercises are completed
    const allCompleted = workout.exercises.every((exercise) => exercise && exercise.completed)
    
    if (existingIndex >= 0) {
      updatedHistory[existingIndex] = {
        ...updatedHistory[existingIndex],
        workout,
        completed: allCompleted,
      }
    } else {
      updatedHistory.push({
        date: currentDatedWorkout.date,
        workout,
        completed: allCompleted,
      })
    }
    
    setWorkoutHistory(updatedHistory)
  }
  
  const saveProgress = () => {
    if (!currentDatedWorkout) {
      toast({
        title: "No Workout Available",
        description: "There is no workout to save for this date.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Save workout history to localStorage with data cleanup
      safeSetItem("workoutHistory", workoutHistory, {
        maxItems: 90, // Keep data for last 90 days
        maxAge: 90,   // Remove entries older than 90 days
        validateFn: (item) => {
          // Validate that the item has all required properties
          return item && 
                 typeof item.date === 'string' && 
                 item.workout && 
                 Array.isArray(item.workout.exercises) &&
                 typeof item.completed === 'boolean';
        }
      });
      
      // Also save the current workout to ensure it's available on page refresh
      if (currentDatedWorkout && currentDatedWorkout.workout) {
        // Update the current workout plan with the completed exercises
        const updatedWorkoutPlan = { ...currentWorkoutPlan };
        
        // Find the day that matches the current workout
        const dayIndex = updatedWorkoutPlan.days.findIndex(
          (day: any) => day.name === currentDatedWorkout.workout.name
        );
        
        if (dayIndex >= 0) {
          // Update the exercises for this day with the completed status
          updatedWorkoutPlan.days[dayIndex].exercises = currentDatedWorkout.workout.exercises;
          
          // Save the updated workout plan
          safeSetItem("currentWorkoutPlan", updatedWorkoutPlan);
        }
      }
      
      // Update last saved timestamp
      setLastSaved(new Date());
      
      // Show sync indicator
      showSyncIndicator();
      
      // Show success toast
      toast({
        title: "Progress Saved",
        description: "Your workout progress has been saved successfully.",
      });
      
      // Recalculate streak
      calculateStreak();
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
    // Get the day of the week (0-6, where 0 is Sunday)
    const dayIndex = currentDate.getDay();
    // Adjust to make Monday index 0 (for workout plans that start on Monday)
    const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    
    // Create a new workout day based on the current plan
    const dateString = currentDate.toISOString().split('T')[0];
    createNewWorkoutDay(dateString, adjustedDayIndex);
    
    // Update workout history by removing the entry for the current date
    const updatedHistory = workoutHistory.filter(
      (workout) => workout.date !== dateString
    );
    
    // Update state
    setWorkoutHistory(updatedHistory);
    
    // Save with data cleanup
    safeSetItem("workoutHistory", updatedHistory, {
      maxItems: 90, // Keep data for last 90 days
      maxAge: 90,   // Remove entries older than 90 days
    });
    
    // Show success toast
    toast({
      title: "Day Reset",
      description: "Your workout for today has been reset to the plan default.",
    });
  }
  
  // Helper functions for UI
  const getDayCompletionPercentage = () => {
    if (!currentDatedWorkout || !currentDatedWorkout.workout || !currentDatedWorkout.workout.exercises || !Array.isArray(currentDatedWorkout.workout.exercises)) return 0
    
    const totalExercises = currentDatedWorkout.workout.exercises.length
    if (totalExercises === 0) return 0
    
    const completedExercises = currentDatedWorkout.workout.exercises.filter(
      (exercise) => exercise && exercise.completed
    ).length
    
    return Math.round((completedExercises / totalExercises) * 100)
  }
  
  const hasWorkout = (date: Date) => {
    if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) return false
    
    const dateString = date.toISOString().split('T')[0]
    return workoutHistory.some((workout) => workout && workout.date === dateString)
  }
  
  const isWorkoutCompleted = (date: Date) => {
    if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) return false
    
    const dateString = date.toISOString().split('T')[0]
    const workout = workoutHistory.find((workout) => workout && workout.date === dateString)
    return workout ? workout.completed : false
  }
  
  const getWeekDates = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }) // Start on Monday
    const weekDates = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      weekDates.push(date)
    }
    
    return weekDates
  }
  
  // Add a function to handle deleting all workout plans with confirmation
  const handleDeleteAllWorkoutPlans = () => {
    if (confirm("Are you sure you want to delete all workout plans? This will remove all workout plans and clear all workout history. This action cannot be undone.")) {
      // Delete all workout plans
      deleteAllWorkoutPlans()
      
      // Clear the workout history completely
      setWorkoutHistory([])
      safeSetItem("workoutHistory", [], {
        replaceExisting: true
      })
      
      // Clear workout progress
      safeSetItem("workoutProgress", {}, {
        replaceExisting: true
      })
      
      toast({
        title: "Workout Plans Deleted",
        description: "All workout plans and history have been deleted. The page will reload to apply changes.",
      })
      
      // Force a page reload after a short delay to ensure everything is reset
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    }
  }
  
  // Render the workout page
  return (
    <MobileLayout>
      <div className="container mx-auto pt-4 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Workout Tracking</h1>
            <p className="text-muted-foreground">
              {formatCurrentDate(currentDate)}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelpDialog(true)}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkPlanDisplayConsistency()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Plan
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={resetDay}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Day
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDeleteAllWorkoutPlans}
                  className="text-red-500 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Plans
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={emergencyResetAndReload}
                  className="text-red-500 dark:text-red-400"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency Reset
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <Card className="overflow-hidden">
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
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWeeklyView(!showWeeklyView)}
                  className="h-7 px-2 text-xs"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {showWeeklyView ? "Hide" : "Show"} Calendar
                </Button>
                <Link href="/workout/history">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    <History className="h-3 w-3 mr-1" />
                    History
                  </Button>
                </Link>
              </div>
            </div>
            
            <CardTitle className="text-base mt-2">
              {formatCurrentDate(currentDate)}
            </CardTitle>
          </CardHeader>
          
          {showWeeklyView && (
            <CardContent className="pb-2">
              <div className="flex justify-between px-2 space-x-1">
                {getWeekDates().map((date, index) => {
                  const formattedDate = format(date, "d");
                  const dayName = format(date, "EEE").substring(0, 1);
                  const isCurrentDate = isSameDay(date, currentDate);
                  const workoutExists = hasWorkout(date);
                  const workoutCompleted = isWorkoutCompleted(date);

                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex flex-col items-center justify-center min-w-[36px] cursor-pointer rounded-md py-1",
                        isCurrentDate
                          ? "bg-primary text-primary-foreground"
                          : workoutExists
                          ? "bg-muted"
                          : "hover:bg-muted"
                      )}
                      onClick={() => navigateToDate(date)}
                    >
                      <div className="text-[10px] font-medium">{dayName}</div>
                      <div className="text-xs font-bold">{formattedDate}</div>
                      {workoutExists && (
                        <div className="mt-0.5">
                          {workoutCompleted ? (
                            <CheckCircle className="h-2.5 w-2.5 text-green-500" />
                          ) : (
                            <Circle className="h-2.5 w-2.5 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}
          
          <CardContent>
            {currentDatedWorkout && currentDatedWorkout.workout ? (
              <div className="space-y-3 max-h-[70vh] md:max-h-none overflow-y-auto pb-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">
                    {currentDatedWorkout.workout.name || 'Workout'}
                  </h2>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetDay}
                      className="h-7 px-2 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
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
                
                <div className="space-y-2">
                  {currentDatedWorkout.workout.exercises && Array.isArray(currentDatedWorkout.workout.exercises) && 
                    currentDatedWorkout.workout.exercises.map((exercise, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg border ${
                        exercise.completed
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900"
                          : "bg-card border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            checked={exercise.completed}
                            onCheckedChange={() => toggleExercise(index)}
                            className="mt-0.5"
                          />
                          <div>
                            <div className="flex items-center">
                              <h3 className="text-sm font-medium">{exercise.name || 'Exercise'}</h3>
                              {exercise.tooltip && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      {exercise.tooltip}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {exercise.sets}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => decrementReps(index)}
                            disabled={exercise.reps <= 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={exercise.reps}
                            onChange={(e) =>
                              updateReps(index, parseInt(e.target.value) || 0)
                            }
                            className="w-12 h-6 text-center text-xs"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => incrementReps(index)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {currentDatedWorkout.workout.exercises && 
                 Array.isArray(currentDatedWorkout.workout.exercises) && 
                 currentDatedWorkout.workout.exercises.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">
                        Completion: {getDayCompletionPercentage()}%
                      </span>
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs font-medium">
                          Streak: {currentStreak} day{currentStreak !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${getDayCompletionPercentage()}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {currentDatedWorkout.completed && (
                  <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900 flex items-center justify-between">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-1.5" />
                      <span className="text-sm font-medium">Workout completed!</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={moveToNextWeek}
                      className="h-7 px-2 text-xs gap-1"
                    >
                      Next Week
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                {lastSaved && (
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    Last saved: {format(lastSaved, "h:mm a")}
                    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500" id="sync-indicator"></span>
                  </p>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No workout available for this date.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetDay} 
                  className="mt-4"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Create Workout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workout Tracker Help</DialogTitle>
            <DialogDescription>
              Learn how to use the workout tracker effectively.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Tracking Your Workouts</h3>
              <p className="text-sm text-muted-foreground">
                Each day shows exercises based on your selected workout plan. Check off exercises as you complete them and track your reps.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Changing Your Plan</h3>
              <p className="text-sm text-muted-foreground">
                You can change your workout plan at any time using the "Change Plan" button. Your progress for each plan is saved separately.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Saving Progress</h3>
              <p className="text-sm text-muted-foreground">
                Your progress is automatically saved as you make changes, but you can also manually save using the Save button.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Streaks</h3>
              <p className="text-sm text-muted-foreground">
                Build a streak by completing workouts on consecutive days. Don't break the chain!
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowHelpDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workout Completed!</DialogTitle>
            <DialogDescription>
              Great job completing today's workout!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center justify-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4">
              <Trophy className="h-12 w-12 text-yellow-500" />
            </div>
            <p className="text-center font-medium">
              You've completed all exercises for today's workout.
            </p>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Current streak: {currentStreak} day{currentStreak !== 1 ? "s" : ""}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletionDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowCompletionDialog(false)
              moveToNextWeek()
            }}>
              Plan Next Week
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  )
}

