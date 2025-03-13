"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Save, Plus, Minus, History, Check, ChevronLeft, ChevronRight, ArrowRight, RefreshCw, Calendar, HelpCircle, Trophy, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MobileLayout } from "@/components/mobile-layout"
import { safeGetItem, safeSetItem } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useSyncIndicator } from "@/hooks/use-sync-indicator"
import { format, addWeeks, startOfWeek, isAfter, isBefore, startOfDay, isSameDay } from "date-fns"
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
  
  // Default workout template
  const defaultWorkoutPlan: WorkoutDay[] = [
    {
      name: "Day 1: Chest & Triceps",
      exercises: [
        { 
          name: "Bench Press", 
          sets: "4x8-10", 
          reps: 0, 
          completed: false,
          tooltip: "Keep your feet flat on the floor, shoulders back, and maintain a slight arch in your lower back."
        },
        { 
          name: "Incline Dumbbell Press", 
          sets: "4x8-10", 
          reps: 0, 
          completed: false,
          tooltip: "Set the bench at a 30-45 degree angle. Lower the weights until your elbows are at 90 degrees."
        },
        { 
          name: "Cable Flys", 
          sets: "3x12", 
          reps: 0, 
          completed: false,
          tooltip: "Keep a slight bend in your elbows throughout the movement. Focus on squeezing your chest."
        },
        { 
          name: "Dips", 
          sets: "3x10", 
          reps: 0, 
          completed: false,
          tooltip: "Lean forward slightly to target chest more. Keep elbows close to body for triceps focus."
        },
        { 
          name: "Skull Crushers", 
          sets: "4x10", 
          reps: 0, 
          completed: false,
          tooltip: "Keep your upper arms stationary and perpendicular to the floor. Lower the weight to your forehead."
        },
        { 
          name: "Rope Triceps Pushdown", 
          sets: "3x12", 
          reps: 0, 
          completed: false,
          tooltip: "Keep your elbows close to your body. Focus on the contraction at the bottom of the movement."
        },
      ],
    },
    {
      name: "Day 2: Back & Biceps",
      exercises: [
        { name: "Deadlifts", sets: "4x6-8", reps: 0, completed: false },
        { name: "Pull-Ups", sets: "4x10", reps: 0, completed: false },
        { name: "Bent-over Rows", sets: "4x8-10", reps: 0, completed: false },
        { name: "Lat Pulldown", sets: "3x12", reps: 0, completed: false },
        { name: "Barbell Bicep Curls", sets: "4x10", reps: 0, completed: false },
        { name: "Hammer Curls", sets: "3x12", reps: 0, completed: false },
      ],
    },
    {
      name: "Day 3: Legs & Abs",
      exercises: [
        { name: "Squats", sets: "4x8-10", reps: 0, completed: false },
        { name: "Romanian Deadlifts", sets: "3x10", reps: 0, completed: false },
        { name: "Leg Press", sets: "4x12", reps: 0, completed: false },
        { name: "Leg Curls", sets: "3x12", reps: 0, completed: false },
        { name: "Hanging Leg Raises", sets: "4x12", reps: 0, completed: false },
        { name: "Cable Crunches", sets: "3x15", reps: 0, completed: false },
      ],
    },
    {
      name: "Day 4: Shoulders & Traps",
      exercises: [
        { name: "Overhead Press", sets: "4x8-10", reps: 0, completed: false },
        { name: "Lateral Raises", sets: "4x12", reps: 0, completed: false },
        { name: "Rear Delt Flys", sets: "3x12", reps: 0, completed: false },
        { name: "Shrugs", sets: "4x15", reps: 0, completed: false },
      ],
    },
    {
      name: "Day 5: Arms & Abs",
      exercises: [
        { name: "Barbell Biceps Curl", sets: "4x10", reps: 0, completed: false },
        { name: "Close-Grip Bench Press", sets: "4x10", reps: 0, completed: false },
        { name: "Concentration Curls", sets: "3x12", reps: 0, completed: false },
        { name: "Rope Pushdowns", sets: "3x12", reps: 0, completed: false },
        { name: "Hanging Leg Raises", sets: "4x12", reps: 0, completed: false },
        { name: "Planks", sets: "3x1 min", reps: 0, completed: false },
      ],
    },
    {
      name: "Day 6: Cardio & Core",
      exercises: [
        { name: "HIIT", sets: "15-20 min", reps: 0, completed: false },
        { name: "Cable Twists", sets: "3x12", reps: 0, completed: false },
        { name: "Russian Twists", sets: "3x15", reps: 0, completed: false },
        { name: "Decline Sit-Ups", sets: "4x12", reps: 0, completed: false },
      ],
    },
    {
      name: "Day 7: Rest",
      exercises: [{ name: "Active Recovery (Optional)", sets: "Light walking/stretching", reps: 0, completed: false }],
    },
  ]
  
  // State for current workout
  const [currentWorkoutDay, setCurrentWorkoutDay] = useState<number>(0)
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutDay>(defaultWorkoutPlan[0])
  
  // State for tracking workouts by date
  const [datedWorkouts, setDatedWorkouts] = useState<DatedWorkout[]>([])
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [showNextWeekDialog, setShowNextWeekDialog] = useState(false)

  // Load saved workout data from localStorage on component mount
  useEffect(() => {
    // Load dated workouts
    const savedDatedWorkouts = safeGetItem<DatedWorkout[]>("datedWorkouts", [])
    if (savedDatedWorkouts.length > 0) {
      setDatedWorkouts(savedDatedWorkouts)
      
      // Find today's workout or the most recent one
      const today = new Date().toISOString().split('T')[0]
      const todaysWorkout = savedDatedWorkouts.find(day => day.date === today)
      
      if (todaysWorkout) {
        // If today's workout exists, use it
        setWorkoutPlan(todaysWorkout.workout)
        setCurrentDate(new Date(today))
        
        // Find the day index
        const dayIndex = defaultWorkoutPlan.findIndex(day => day.name === todaysWorkout.workout.name)
        if (dayIndex >= 0) {
          setCurrentWorkoutDay(dayIndex)
        }
      } else {
        // Find the most recent workout day
        const sortedDays = [...savedDatedWorkouts].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        
        if (sortedDays.length > 0) {
          const latestDate = new Date(sortedDays[0].date)
          
          // If the latest date is in the past, create a new day for today
          if (isBefore(latestDate, startOfDay(new Date()))) {
            createNewWorkoutDay(today, 0) // Start with Day 1
          } else {
            // Otherwise use the latest workout
            setWorkoutPlan(sortedDays[0].workout)
            setCurrentDate(latestDate)
            
            // Find the day index
            const dayIndex = defaultWorkoutPlan.findIndex(day => day.name === sortedDays[0].workout.name)
            if (dayIndex >= 0) {
              setCurrentWorkoutDay(dayIndex)
            }
          }
        } else {
          // If no workout days exist, create one for today
          createNewWorkoutDay(new Date().toISOString().split('T')[0], 0) // Start with Day 1
        }
      }
    } else {
      // If no workout days exist, create one for today
      createNewWorkoutDay(new Date().toISOString().split('T')[0], 0) // Start with Day 1
    }

    // Show help dialog for first-time users
    const hasSeenHelp = safeGetItem<boolean>("hasSeenWorkoutHelp", false)
    if (!hasSeenHelp) {
      // Set a small delay to show the help dialog after the page loads
      const timer = setTimeout(() => {
        setShowHelpDialog(true)
        safeSetItem("hasSeenWorkoutHelp", true)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [])
  
  // Create a new workout day
  const createNewWorkoutDay = (dateString: string, dayIndex: number) => {
    // Deep clone the default workout for the specified day
    const newWorkout: WorkoutDay = JSON.parse(JSON.stringify(defaultWorkoutPlan[dayIndex]))
    
    const newDatedWorkout: DatedWorkout = {
      date: dateString,
      workout: newWorkout,
      completed: false
    }
    
    setWorkoutPlan(newWorkout)
    setCurrentWorkoutDay(dayIndex)
    setCurrentDate(new Date(dateString))
    
    // Add to dated workouts
    const updatedDatedWorkouts = [...datedWorkouts, newDatedWorkout]
    setDatedWorkouts(updatedDatedWorkouts)
    safeSetItem("datedWorkouts", updatedDatedWorkouts)
  }
  
  // Navigate to a specific date
  const navigateToDate = (date: Date, dayIndex?: number) => {
    const dateString = date.toISOString().split('T')[0]
    const existingWorkoutDay = datedWorkouts.find(day => day.date === dateString)
    
    if (existingWorkoutDay) {
      // If workout for this date exists, load it
      setWorkoutPlan(existingWorkoutDay.workout)
      setCurrentDate(date)
      
      // Find the day index
      const dayIndex = defaultWorkoutPlan.findIndex(day => day.name === existingWorkoutDay.workout.name)
      if (dayIndex >= 0) {
        setCurrentWorkoutDay(dayIndex)
      }
    } else if (dayIndex !== undefined) {
      // Create a new workout day for this date with the specified day index
      createNewWorkoutDay(dateString, dayIndex)
    } else {
      // Create a new workout day for this date with the next day in sequence
      const nextDayIndex = (currentWorkoutDay + 1) % 7
      createNewWorkoutDay(dateString, nextDayIndex)
    }
  }
  
  // Navigate to previous day
  const goToPreviousDay = () => {
    const prevDate = new Date(currentDate)
    prevDate.setDate(prevDate.getDate() - 1)
    navigateToDate(prevDate)
  }
  
  // Navigate to next day
  const goToNextDay = () => {
    const nextDate = new Date(currentDate)
    nextDate.setDate(nextDate.getDate() + 1)
    
    // If moving to a new week, show confirmation dialog
    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const nextWeekStart = startOfWeek(nextDate, { weekStartsOn: 1 })
    
    if (nextWeekStart.getTime() !== currentWeekStart.getTime() && 
        isAfter(nextDate, new Date())) {
      setShowNextWeekDialog(true)
    } else {
      navigateToDate(nextDate)
    }
  }
  
  // Move to next week
  const moveToNextWeek = () => {
    const nextWeekDate = addWeeks(currentDate, 1)
    // Reset to Day 1 for the new week
    navigateToDate(nextWeekDate, 0)
    setShowNextWeekDialog(false)
  }
  
  // Format date for display
  const formatCurrentDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy')
  }
  
  // Check if a date is today
  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }

  // Calculate current streak
  const calculateStreak = () => {
    if (datedWorkouts.length === 0) return 0
    
    // Sort workouts by date (newest first)
    const sortedWorkouts = [...datedWorkouts].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Check if there's a completed workout for today
    const todayStr = today.toISOString().split('T')[0]
    const hasTodayWorkout = sortedWorkouts.some(workout => 
      workout.date === todayStr && workout.completed
    )
    
    if (!hasTodayWorkout) {
      // Check if there's a completed workout for yesterday
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      const hasYesterdayWorkout = sortedWorkouts.some(workout => 
        workout.date === yesterdayStr && workout.completed
      )
      
      if (!hasYesterdayWorkout) {
        // If no workout for today or yesterday, streak is broken
        return 0
      }
    }
    
    // Count consecutive days with completed workouts
    let currentDate = new Date(today)
    let checkingDate = hasTodayWorkout ? today : new Date(today.setDate(today.getDate() - 1))
    
    while (true) {
      const dateStr = checkingDate.toISOString().split('T')[0]
      const hasCompletedWorkout = sortedWorkouts.some(workout => 
        workout.date === dateStr && workout.completed
      )
      
      if (hasCompletedWorkout) {
        streak++
        checkingDate.setDate(checkingDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }
  
  // Update streak when datedWorkouts changes
  useEffect(() => {
    if (datedWorkouts.length > 0) {
      const streak = calculateStreak()
      setCurrentStreak(streak)
    }
  }, [datedWorkouts])

  const toggleExercise = (exerciseIndex: number) => {
    const updatedWorkoutPlan = { ...workoutPlan }
    updatedWorkoutPlan.exercises[exerciseIndex].completed = !updatedWorkoutPlan.exercises[exerciseIndex].completed
    setWorkoutPlan(updatedWorkoutPlan)
    
    // Update current dated workout
    updateCurrentDatedWorkout(updatedWorkoutPlan)
    
    // Auto-save when toggling exercises
    autoSaveWorkoutProgress(updatedWorkoutPlan)
    
    // Check if all exercises are now completed
    const allCompleted = updatedWorkoutPlan.exercises.every(ex => ex.completed)
    if (allCompleted) {
      // Recalculate streak
      const newStreak = calculateStreak()
      setCurrentStreak(newStreak)
      
      // Show completion dialog
      setShowCompletionDialog(true)
    }
  }

  const updateReps = (exerciseIndex: number, value: number) => {
    const updatedWorkoutPlan = { ...workoutPlan }
    updatedWorkoutPlan.exercises[exerciseIndex].reps = value
    setWorkoutPlan(updatedWorkoutPlan)
    
    // Update current dated workout
    updateCurrentDatedWorkout(updatedWorkoutPlan)
    
    // Auto-save when updating reps
    autoSaveWorkoutProgress(updatedWorkoutPlan)
  }

  const incrementReps = (exerciseIndex: number) => {
    const updatedWorkoutPlan = { ...workoutPlan }
    updatedWorkoutPlan.exercises[exerciseIndex].reps += 1
    setWorkoutPlan(updatedWorkoutPlan)
    
    // Update current dated workout
    updateCurrentDatedWorkout(updatedWorkoutPlan)
    
    // Auto-save when incrementing reps
    autoSaveWorkoutProgress(updatedWorkoutPlan)
  }

  const decrementReps = (exerciseIndex: number) => {
    const updatedWorkoutPlan = { ...workoutPlan }
    const currentReps = updatedWorkoutPlan.exercises[exerciseIndex].reps
    if (currentReps > 0) {
      updatedWorkoutPlan.exercises[exerciseIndex].reps -= 1
      setWorkoutPlan(updatedWorkoutPlan)
      
      // Update current dated workout
      updateCurrentDatedWorkout(updatedWorkoutPlan)
      
      // Auto-save when decrementing reps
      autoSaveWorkoutProgress(updatedWorkoutPlan)
    }
  }
  
  // Update the current dated workout
  const updateCurrentDatedWorkout = (workout: WorkoutDay) => {
    const dateString = currentDate.toISOString().split('T')[0]
    const updatedDatedWorkouts = [...datedWorkouts]
    
    // Find the index of the current dated workout
    const dayIndex = updatedDatedWorkouts.findIndex(day => day.date === dateString)
    
    if (dayIndex >= 0) {
      // Update existing day
      updatedDatedWorkouts[dayIndex].workout = workout
      
      // Check if all exercises are completed
      const allCompleted = workout.exercises.every(exercise => exercise.completed)
      
      updatedDatedWorkouts[dayIndex].completed = allCompleted
    } else {
      // Add new day
      updatedDatedWorkouts.push({
        date: dateString,
        workout: workout,
        completed: false
      })
    }
    
    setDatedWorkouts(updatedDatedWorkouts)
    safeSetItem("datedWorkouts", updatedDatedWorkouts)
  }
  
  // Auto-save function
  const autoSaveWorkoutProgress = (workout: WorkoutDay) => {
    // Update workout history
    updateWorkoutHistory(workout)
    
    // Show sync indicator
    showSyncIndicator()
    
    // Update last saved time
    setLastSaved(new Date())
  }
  
  // Function to update workout history
  const updateWorkoutHistory = (workout: WorkoutDay) => {
    const today = currentDate.toISOString().split('T')[0]
    const existingHistory = safeGetItem<any[]>("workoutHistory", [])
    
    // Only save exercises with reps > 0
    const exercisesToSave: any[] = []
    
    workout.exercises.forEach(exercise => {
      if (exercise.reps > 0) {
        // Check if this exercise already has an entry for today
        const existingEntry = existingHistory.find(entry => 
          entry.date === today && entry.exerciseName === exercise.name
        )
        
        if (!existingEntry) {
          exercisesToSave.push({
            date: today,
            exerciseName: exercise.name,
            reps: exercise.reps
          })
        } else if (existingEntry.reps !== exercise.reps) {
          // Update existing entry if reps have changed
          existingEntry.reps = exercise.reps
        }
      }
    })
    
    if (exercisesToSave.length > 0 || existingHistory.some(entry => entry.date === today)) {
      const updatedHistory = [...existingHistory.filter(entry => entry.date !== today), 
        ...exercisesToSave, 
        ...existingHistory.filter(entry => 
          entry.date === today && !exercisesToSave.some(e => e.exerciseName === entry.exerciseName)
        )
      ]
      
      safeSetItem("workoutHistory", updatedHistory)
    }
  }

  const saveProgress = () => {
    try {
      setIsSaving(true)
      
      // Update current dated workout
      updateCurrentDatedWorkout(workoutPlan)
      
      // Update workout history
      updateWorkoutHistory(workoutPlan)
      
      // Show sync indicator
      showSyncIndicator()
      
      // Update last saved time
      setLastSaved(new Date())
      
      toast({
        title: "Progress saved",
        description: "Your workout progress has been saved successfully.",
      })
      
      setTimeout(() => {
        setIsSaving(false)
      }, 1000)
    } catch (error) {
      console.error("Error saving workout data:", error)
      toast({
        title: "Error saving progress",
        description: "There was a problem saving your data. Please try again.",
        variant: "destructive"
      })
      setIsSaving(false)
    }
  }

  const resetDay = () => {
    const updatedWorkoutPlan = { ...workoutPlan }
    updatedWorkoutPlan.exercises.forEach((exercise) => {
      exercise.completed = false
      exercise.reps = 0
    })
    setWorkoutPlan(updatedWorkoutPlan)
    
    // Update current dated workout
    updateCurrentDatedWorkout(updatedWorkoutPlan)
    
    // Auto-save when resetting day
    autoSaveWorkoutProgress(updatedWorkoutPlan)
    
    toast({
      title: "Day reset",
      description: "All exercises have been reset.",
    })
  }

  // Calculate completion percentage for the current day
  const getDayCompletionPercentage = () => {
    if (workoutPlan.exercises.length === 0) return 0
    
    const completedExercises = workoutPlan.exercises.filter(ex => ex.completed).length
    return Math.round((completedExercises / workoutPlan.exercises.length) * 100)
  }
  
  // Check if a date has a workout
  const hasWorkout = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return datedWorkouts.some(day => day.date === dateString)
  }
  
  // Check if a date's workout is completed
  const isWorkoutCompleted = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    const workoutDay = datedWorkouts.find(day => day.date === dateString)
    return workoutDay?.completed || false
  }

  // Get dates for the current week
  const getWeekDates = () => {
    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday as start of week
    const weekDates = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(date.getDate() + i)
      weekDates.push(date)
    }
    
    return weekDates
  }

  return (
    <MobileLayout>
      <div className="container max-w-md mx-auto px-3 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Workout Plan</h1>
            {currentStreak > 0 && (
              <div className="ml-2 flex items-center bg-orange-100 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-full px-2 py-0.5">
                <span className="text-xs font-medium">🔥 {currentStreak} day{currentStreak !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowHelpDialog(true)}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setShowWeeklyView(!showWeeklyView)}
            >
              <Calendar className="h-4 w-4 mr-1" />
              {showWeeklyView ? "Day" : "Week"}
            </Button>
            <Link href="/workout/history">
              <Button variant="outline" size="sm" className="h-8">
                <History className="h-4 w-4 mr-1" />
                History
              </Button>
            </Link>
            <Button 
              onClick={saveProgress} 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 relative"
              disabled={isSaving}
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {lastSaved && !isSaving && (
                <span className="absolute -bottom-4 right-0 text-[10px] text-muted-foreground">
                  {format(lastSaved, 'HH:mm')}
                </span>
              )}
            </Button>
          </div>
        </div>
        
        {/* Day navigation */}
        <Card className="mb-4 shadow-sm">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={goToPreviousDay}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-center">
                <p className="text-sm font-medium">{formatCurrentDate(currentDate)}</p>
                <p className="text-xs">{workoutPlan.name}</p>
                {isWorkoutCompleted(currentDate) && (
                  <p className="text-xs text-green-500">Completed</p>
                )}
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={goToNextDay}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Weekly view */}
        {showWeeklyView && (
          <Card className="mb-4 shadow-sm">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Weekly Progress</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="grid grid-cols-7 gap-1">
                {getWeekDates().map((date, index) => {
                  const isWorkoutDay = hasWorkout(date)
                  const isCompleted = isWorkoutCompleted(date)
                  const isCurrentDay = isSameDay(date, currentDate)
                  
                  return (
                    <div 
                      key={index}
                      onClick={() => navigateToDate(date)}
                      className={`flex flex-col items-center justify-center p-1 rounded-md cursor-pointer transition-all ${
                        isCurrentDay 
                          ? "bg-primary/10 border border-primary" 
                          : isCompleted 
                            ? "bg-green-50 dark:bg-green-950/20" 
                            : isWorkoutDay 
                              ? "bg-muted/50" 
                              : ""
                      }`}
                    >
                      <span className="text-xs font-medium">{format(date, 'EEE')}</span>
                      <span className={`text-xs ${isToday(date) ? "font-bold" : ""}`}>
                        {format(date, 'd')}
                      </span>
                      {isCompleted && (
                        <Check className="h-3 w-3 text-green-500 mt-1" />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-4 shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Muscle Growth & Fat Loss</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="bg-muted rounded-full px-2 py-1">✅ 6-day split</div>
              <div className="bg-muted rounded-full px-2 py-1">✅ Core for abs</div>
              <div className="bg-muted rounded-full px-2 py-1">✅ Progressive overload</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{workoutPlan.name}</CardTitle>
              <Button variant="outline" size="sm" onClick={resetDay} className="h-7 text-xs">
                Reset
              </Button>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${getDayCompletionPercentage()}%` }}
              ></div>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-3">
              {workoutPlan.exercises.map((exercise, exerciseIndex) => (
                <div 
                  key={exerciseIndex} 
                  className={`flex flex-col p-2 rounded-md transition-all duration-300 ${
                    exercise.completed 
                      ? "bg-green-50 dark:bg-green-950/20 border-l-2 border-green-500" 
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`exercise-${exerciseIndex}`}
                      checked={exercise.completed}
                      onCheckedChange={() => toggleExercise(exerciseIndex)}
                      className={`h-5 w-5 ${
                        exercise.completed 
                          ? "border-green-500 bg-green-500 text-primary-foreground" 
                          : ""
                      }`}
                    />
                    <div className="flex-grow">
                      <div className="flex items-center">
                        <label
                          htmlFor={`exercise-${exerciseIndex}`}
                          className={`flex-grow cursor-pointer text-sm transition-all duration-300 ${
                            exercise.completed 
                              ? "line-through text-muted-foreground" 
                              : ""
                          }`}
                        >
                          {exercise.name}
                        </label>
                        
                        {exercise.tooltip && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[200px] p-2">
                                <p className="text-xs">{exercise.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{exercise.sets}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-2 ml-7">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => decrementReps(exerciseIndex)}
                        disabled={exercise.reps === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <div className="w-12 text-center">
                        <span className={`text-xs font-medium ${
                          exercise.reps > 0 ? "text-primary" : "text-muted-foreground"
                        }`}>
                          {exercise.reps} reps
                        </span>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => incrementReps(exerciseIndex)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add sync indicator */}
        <div className="fixed bottom-20 right-4">
          <div className="bg-green-500 text-white rounded-full p-1 shadow-lg opacity-0 scale-75 transform transition-all duration-300" id="sync-indicator">
            <Check className="h-4 w-4" />
          </div>
        </div>
        
        {/* Next Week Dialog */}
        <Dialog open={showNextWeekDialog} onOpenChange={setShowNextWeekDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move to Next Week?</DialogTitle>
              <DialogDescription>
                You're about to move to the next week. Your current progress will be saved.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm">
                Moving to the next week will create a new workout plan starting with Day 1.
                All your historical data will be preserved.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNextWeekDialog(false)}>
                Cancel
              </Button>
              <Button onClick={moveToNextWeek}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue to Next Week
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Workout Completion Dialog */}
        <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Workout Completed! 🎉</DialogTitle>
              <DialogDescription className="text-center">
                Great job completing today's workout!
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-6">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Trophy className="h-12 w-12 text-primary" />
              </div>
              <p className="text-center text-sm mb-4">
                You've completed all exercises for {workoutPlan.name}
              </p>
              
              {currentStreak > 0 && (
                <div className="bg-orange-100 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-full px-3 py-1 mb-4">
                  <p className="text-sm font-medium">🔥 {currentStreak} day streak!</p>
                </div>
              )}
              
              <p className="text-center text-xs text-muted-foreground">
                Keep up the good work! Consistency is key to achieving your fitness goals.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowCompletionDialog(false)} className="w-full">
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Help Dialog */}
        <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>How to Use Workout Tracking</DialogTitle>
              <DialogDescription>
                Get the most out of your workout tracking experience
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Daily Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Use the day navigation at the top to move between workout days. 
                  Each day has a specific workout focus.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Tracking Exercises</h3>
                <p className="text-sm text-muted-foreground">
                  Check off exercises as you complete them. Use the + and - buttons to 
                  track your reps for each exercise.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Weekly View</h3>
                <p className="text-sm text-muted-foreground">
                  Toggle the Week button to see your progress across the entire week. 
                  Click on any day to jump to that workout.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Auto-Saving</h3>
                <p className="text-sm text-muted-foreground">
                  Your progress is automatically saved as you track exercises. 
                  You can also manually save using the save button.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Weekly Progression</h3>
                <p className="text-sm text-muted-foreground">
                  At the end of each week, you'll be prompted to move to the next week. 
                  All your historical data is preserved.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowHelpDialog(false)}>
                Got it
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  )
}

