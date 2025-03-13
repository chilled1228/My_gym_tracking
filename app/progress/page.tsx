"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, TrendingUp, Calendar, Dumbbell, Utensils, ChevronLeft, ChevronRight, ExternalLink, Info, HelpCircle, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MobileLayout } from "@/components/mobile-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, startOfWeek, addDays, isSameDay, subDays, parseISO, isValid, isWithinInterval, endOfWeek, isAfter } from "date-fns"
import { safeGetItem, safeSetItem } from "@/lib/utils"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface Exercise {
  name: string
  sets: string
  reps: number
  completed: boolean
}

interface WorkoutDay {
  name: string
  exercises: Exercise[]
}

interface MealItem {
  name: string
  completed: boolean
  calories: number
  protein: number
  carbs: number
  fats: number
}

interface Meal {
  time: string
  name: string
  items: MealItem[]
}

interface DailyMacros {
  date: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

interface WorkoutHistory {
  date: string
  exerciseName: string
  reps: number
}

// Helper function to check if a date is today
function isToday(date: Date) {
  return isSameDay(date, new Date())
}

// Helper component to explain the diet calendar
function DietCalendarHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-3 right-3">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Diet Calendar Guide</DialogTitle>
          <DialogDescription>
            Understanding your diet tracking calendar
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium mb-1">Navigation</h3>
            <p className="text-muted-foreground">
              Use the arrow buttons to navigate between weeks. The current day is highlighted.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-1">Bar Heights</h3>
            <p className="text-muted-foreground">
              The height of each bar represents the percentage of your daily target consumed.
              A full-height bar means you've reached 100% of your target.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-1">Color Coding</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary/50 rounded-full mr-1"></div>
                <span>Calories</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500/50 rounded-full mr-1"></div>
                <span>Protein</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500/50 rounded-full mr-1"></div>
                <span>Carbs</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500/50 rounded-full mr-1"></div>
                <span>Fats</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-1">Data Syncing</h3>
            <p className="text-muted-foreground">
              Your diet data is automatically synced when you mark items as completed in the Diet tab.
              The calendar updates in real-time to reflect your progress.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper component to show diet tracking progress for the current week
function DietWeekProgress() {
  const { toast } = useToast()
  const [dietDays, setDietDays] = useState<any[]>([])
  const [currentWeek, setCurrentWeek] = useState<Date[]>([])
  
  useEffect(() => {
    // Load diet days
    const savedDietDays = safeGetItem<any[]>("dietDays", [])
    if (savedDietDays.length > 0) {
      setDietDays(savedDietDays)
    }
    
    // Calculate current week days
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekDays = []
    
    for (let i = 0; i < 7; i++) {
      weekDays.push(addDays(weekStart, i))
    }
    
    setCurrentWeek(weekDays)
  }, [])
  
  // Check if a date has a diet plan
  const hasDietPlan = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return dietDays.some(day => day.date === dateString)
  }
  
  // Check if a date's diet is completed
  const isDietCompleted = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    const dietDay = dietDays.find(day => day.date === dateString)
    return dietDay?.completed || false
  }
  
  // Calculate completion percentage for the week
  const getWeekCompletionPercentage = () => {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
    
    // Only count days up to today
    const relevantDays = dietDays.filter(day => {
      const dayDate = new Date(day.date)
      return isWithinInterval(dayDate, { start: weekStart, end: today }) && 
             !isAfter(dayDate, today)
    })
    
    if (relevantDays.length === 0) return 0
    
    const completedDays = relevantDays.filter(day => day.completed).length
    return Math.round((completedDays / relevantDays.length) * 100)
  }
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Weekly Diet Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-4">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {currentWeek.map((day, index) => (
            <div 
              key={index} 
              className={`text-center p-1 rounded-md ${
                isToday(day) ? 'bg-primary/10' : 
                hasDietPlan(day) ? 'bg-muted/30' : ''
              }`}
            >
              <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
              <p className={`text-xs font-medium ${isToday(day) ? 'text-primary' : ''}`}>
                {format(day, 'd')}
              </p>
              {isDietCompleted(day) ? (
                <div className="w-5 h-5 bg-green-500 rounded-full mx-auto mt-1 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              ) : hasDietPlan(day) ? (
                <div className="w-5 h-5 bg-muted rounded-full mx-auto mt-1" />
              ) : (
                <div className="w-5 h-5 mx-auto mt-1" />
              )}
            </div>
          ))}
        </div>
        
        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-xs">
            <span>Week Completion</span>
            <span>{getWeekCompletionPercentage()}%</span>
          </div>
          <Progress value={getWeekCompletionPercentage()} className="h-2" />
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Track your diet day by day to see your progress here.</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProgressPage() {
  const { toast } = useToast()
  const [workoutStats, setWorkoutStats] = useState({
    totalExercises: 0,
    completedExercises: 0,
    completionPercentage: 0,
    totalReps: 0
  })
  
  const [dietStats, setDietStats] = useState({
    totalItems: 0,
    completedItems: 0,
    completionPercentage: 0,
    consumedCalories: 0,
    totalCalories: 2000, // Default values
    consumedProtein: 0,
    totalProtein: 150,
    consumedCarbs: 0,
    totalCarbs: 200,
    consumedFats: 0,
    totalFats: 70
  })
  
  const [dailyHistory, setDailyHistory] = useState<DailyMacros[]>([])
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedExercise, setSelectedExercise] = useState<string>("")
  
  // Load saved data from localStorage on component mount
  useEffect(() => {
    // Get workout stats
    const savedWorkout = safeGetItem<WorkoutDay[]>("workoutPlan", [])
    if (savedWorkout.length > 0) {
      const totalExercises = savedWorkout.reduce((sum: number, day: WorkoutDay) => sum + day.exercises.length, 0)
      const completedExercises = savedWorkout.reduce(
        (sum: number, day: WorkoutDay) => sum + day.exercises.filter(ex => ex.completed).length, 
        0
      )
      const completionPercentage = Math.round((completedExercises / totalExercises) * 100)
      const totalReps = savedWorkout.reduce(
        (sum: number, day: WorkoutDay) => sum + day.exercises.reduce(
          (daySum: number, exercise: Exercise) => daySum + exercise.reps, 0
        ), 0
      )
      
      setWorkoutStats({
        totalExercises,
        completedExercises,
        completionPercentage,
        totalReps
      })

      // Extract all unique exercise names for the dropdown
      const allExercises = savedWorkout.flatMap(day => day.exercises.map(ex => ex.name))
      const uniqueExercises = [...new Set(allExercises)]
      if (uniqueExercises.length > 0 && !selectedExercise) {
        setSelectedExercise(uniqueExercises[0])
      }

      // Save workout history if it doesn't exist
      const today = new Date().toISOString().split('T')[0]
      const existingHistory = safeGetItem<WorkoutHistory[]>("workoutHistory", [])
      
      // Only save today's workout data if it doesn't already exist in history
      const todaysEntries = existingHistory.filter(entry => entry.date === today)
      const exercisesToSave: WorkoutHistory[] = []
      
      savedWorkout.forEach(day => {
        day.exercises.forEach(exercise => {
          if (exercise.reps > 0) {
            // Check if this exercise already has an entry for today
            const existingEntry = todaysEntries.find(entry => 
              entry.date === today && entry.exerciseName === exercise.name
            )
            
            if (!existingEntry) {
              exercisesToSave.push({
                date: today,
                exerciseName: exercise.name,
                reps: exercise.reps
              })
            }
          }
        })
      })
      
      if (exercisesToSave.length > 0) {
        const updatedHistory = [...existingHistory, ...exercisesToSave]
        safeSetItem("workoutHistory", updatedHistory)
        setWorkoutHistory(updatedHistory)
      } else {
        setWorkoutHistory(existingHistory)
      }
    }
    
    // Get diet stats - updated to use dietDays
    const savedDietDays = safeGetItem<any[]>("dietDays", [])
    if (savedDietDays.length > 0) {
      // Find today's diet or the most recent one
      const today = new Date().toISOString().split('T')[0]
      const todaysDiet = savedDietDays.find(day => day.date === today)
      
      const dietToUse = todaysDiet || savedDietDays[savedDietDays.length - 1]
      
      if (dietToUse && dietToUse.meals) {
        const meals = dietToUse.meals
        const totalItems = meals.reduce((sum: number, meal: any) => sum + meal.items.length, 0)
        const completedItems = meals.reduce(
          (sum: number, meal: any) => sum + meal.items.filter((item: any) => item.completed).length, 
          0
        )
        const completionPercentage = Math.round((completedItems / totalItems) * 100)
        
        // Calculate total calories and macros
        const totalCalories = meals.reduce((sum: number, meal: any) => 
          sum + meal.items.reduce((mealSum: number, item: any) => mealSum + item.calories, 0), 0)
        
        const totalProtein = meals.reduce((sum: number, meal: any) => 
          sum + meal.items.reduce((mealSum: number, item: any) => mealSum + item.protein, 0), 0)
        
        const totalCarbs = meals.reduce((sum: number, meal: any) => 
          sum + meal.items.reduce((mealSum: number, item: any) => mealSum + item.carbs, 0), 0)
        
        const totalFats = meals.reduce((sum: number, meal: any) => 
          sum + meal.items.reduce((mealSum: number, item: any) => mealSum + item.fats, 0), 0)
        
        // Calculate consumed calories and macros
        const consumedCalories = meals.reduce((sum: number, meal: any) => 
          sum + meal.items.reduce((mealSum: number, item: any) => 
            mealSum + (item.completed ? item.calories : 0), 0), 0)
        
        const consumedProtein = meals.reduce((sum: number, meal: any) => 
          sum + meal.items.reduce((mealSum: number, item: any) => 
            mealSum + (item.completed ? item.protein : 0), 0), 0)
        
        const consumedCarbs = meals.reduce((sum: number, meal: any) => 
          sum + meal.items.reduce((mealSum: number, item: any) => 
            mealSum + (item.completed ? item.carbs : 0), 0), 0)
        
        const consumedFats = meals.reduce((sum: number, meal: any) => 
          sum + meal.items.reduce((mealSum: number, item: any) => 
            mealSum + (item.completed ? item.fats : 0), 0), 0)
        
        setDietStats({
          totalItems,
          completedItems,
          completionPercentage,
          consumedCalories: Math.round(consumedCalories),
          totalCalories,
          consumedProtein: Math.round(consumedProtein),
          totalProtein,
          consumedCarbs: Math.round(consumedCarbs),
          totalCarbs,
          consumedFats: Math.round(consumedFats),
          totalFats
        })
      }
    }
    
    // Get daily history
    const savedHistory = safeGetItem<DailyMacros[]>("dietHistory", [])
    if (savedHistory.length > 0) {
      // Validate dates and ensure they're in proper format
      const validatedHistory = savedHistory.filter(entry => {
        try {
          return isValid(parseISO(entry.date))
        } catch (e) {
          return false
        }
      })
      
      setDailyHistory(validatedHistory)
    } else {
      // Initialize with some sample data for the past 14 days
      initializeDietHistory()
    }
  }, [])
  
  // Initialize diet history with sample data
  const initializeDietHistory = () => {
    const today = new Date()
    const initialHistory: DailyMacros[] = []
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i)
      
      // Generate some random data for demonstration
      const randomPercentage = Math.random() * 0.3 + 0.7 // 70-100% completion
      
      initialHistory.push({
        date: date.toISOString().split('T')[0],
        calories: Math.round(dietStats.totalCalories * (i === 0 ? 0.8 : randomPercentage)),
        protein: Math.round(dietStats.totalProtein * (i === 0 ? 0.8 : randomPercentage)),
        carbs: Math.round(dietStats.totalCarbs * (i === 0 ? 0.8 : randomPercentage)),
        fats: Math.round(dietStats.totalFats * (i === 0 ? 0.8 : randomPercentage))
      })
    }
    
    setDailyHistory(initialHistory)
    safeSetItem("dietHistory", initialHistory)
  }
  
  // Calendar functions
  const getWeekDays = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }) // Start from Monday
    const days = []
    
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i))
    }
    
    return days
  }
  
  const weekDays = getWeekDays(selectedDate)
  
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setSelectedDate(newDate)
  }
  
  const getDayData = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return dailyHistory.find(day => day.date === dateString) || {
      date: dateString,
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    }
  }
  
  // Get last 7 days for trend view
  const getLast7Days = () => {
    const days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      days.push(subDays(today, i))
    }
    
    return days
  }
  
  const last7Days = getLast7Days()
  
  // Get exercise history for selected exercise
  const getExerciseHistory = (exerciseName: string) => {
    return workoutHistory
      .filter(entry => entry.exerciseName === exerciseName)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7) // Get last 7 entries
  }
  
  // Get all unique exercise names from workout history
  const getUniqueExercises = () => {
    return [...new Set(workoutHistory.map(entry => entry.exerciseName))]
  }
  
  // Get today's date
  const today = new Date()
  const options = { weekday: 'long', month: 'short', day: 'numeric' } as const
  const formattedDate = today.toLocaleDateString('en-US', options)
  
  return (
    <MobileLayout>
      <div className="container max-w-md mx-auto px-3 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Progress</h1>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-2 h-auto p-1">
            <TabsTrigger value="overview" className="text-xs py-2">Overview</TabsTrigger>
            <TabsTrigger value="history" className="text-xs py-2">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base flex items-center">
                    <Dumbbell className="h-4 w-4 mr-2" />
                    Workout
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Completion</span>
                      <span>{workoutStats.completionPercentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${workoutStats.completionPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{workoutStats.completedExercises} completed</span>
                      <span>{workoutStats.totalReps} total reps</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base flex items-center">
                    <Utensils className="h-4 w-4 mr-2" />
                    Diet
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Completion</span>
                      <span>{dietStats.completionPercentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${dietStats.completionPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{dietStats.consumedCalories} kcal</span>
                      <span>{dietStats.consumedProtein}g protein</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <DietWeekProgress />
            
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Exercise Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                {/* ... existing content ... */}
              </CardContent>
            </Card>
            
            <Card className="shadow-sm relative">
              <DietCalendarHelp />
              <CardHeader className="py-3 px-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Weekly Diet Tracker
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => navigateWeek('prev')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => navigateWeek('next')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-2 px-4">
                {/* ... existing content ... */}
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  7-Day Diet Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                {/* ... existing content ... */}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            {/* ... existing content ... */}
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  )
}

