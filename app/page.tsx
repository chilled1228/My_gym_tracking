"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Dumbbell, Utensils, BarChart, Calendar, Bell, TrendingUp, Award, ChevronRight, Flame } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { useEffect, useState } from "react"
import { safeGetItem } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { SectionHeader } from "@/components/section-header"
import { CardLink } from "@/components/ui/card-link"
import Link from "next/link"

interface WorkoutDay {
  name: string
  exercises: { name: string; sets: string; completed: boolean }[]
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

interface DietDay {
  date: string
  meals: Meal[]
  completed: boolean
}

export default function Home() {
  const [workoutCompletion, setWorkoutCompletion] = useState(0)
  const [dietCompletion, setDietCompletion] = useState(0)
  const [calorieStats, setCalorieStats] = useState({
    consumed: 0,
    total: 0,
    percentage: 0
  })
  const [macroHistory, setMacroHistory] = useState<DailyMacros[]>([])
  
  // Function to load data from localStorage
  const loadData = () => {
    try {
      // Get workout completion
      const workoutPlan = safeGetItem<WorkoutDay[]>("workoutPlan", [])
      if (workoutPlan.length > 0) {
        const totalExercises = workoutPlan.reduce((sum: number, day: WorkoutDay) => sum + day.exercises.length, 0)
        const completedExercises = workoutPlan.reduce(
          (sum: number, day: WorkoutDay) => sum + day.exercises.filter(ex => ex.completed).length, 
          0
        )
        setWorkoutCompletion(totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0)
      }
      
      // Get macro history
      const history = safeGetItem<DailyMacros[]>("macroHistory", [])
      
      // Filter out any invalid entries
      const validHistory = history.filter(item => 
        item && typeof item === 'object' && item.date && 
        typeof item.calories === 'number' && 
        typeof item.protein === 'number' && 
        typeof item.carbs === 'number' && 
        typeof item.fats === 'number'
      )
      
      // Sort by date (newest first) to ensure we get the most recent data
      const sortedHistory = [...validHistory].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      
      setMacroHistory(sortedHistory)
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]
      console.log("Today's date:", today)
      
      // Find today's macros in the sorted history
      const todaysMacros = sortedHistory.find(item => item.date === today)
      console.log("Found today's macros:", todaysMacros)
      
      if (todaysMacros) {
        // Get target calories from current diet plan if available
        const currentDietPlan = safeGetItem<{targetCalories?: number}>("currentDietPlan", {targetCalories: 2000})
        const targetCalories = currentDietPlan && typeof currentDietPlan.targetCalories === 'number' ? 
          currentDietPlan.targetCalories : 2000 // Default target
        
        setCalorieStats({
          consumed: Math.round(todaysMacros.calories),
          total: targetCalories,
          percentage: targetCalories > 0 ? Math.min(100, Math.round((todaysMacros.calories / targetCalories) * 100)) : 0
        })
      } else {
        // No data for today, check diet history
        const dietHistory = safeGetItem<DietDay[]>("dietHistory", [])
        if (Array.isArray(dietHistory) && dietHistory.length > 0) {
          const todaysDiet = dietHistory.find((item) => item && item.date === today)
          if (todaysDiet && todaysDiet.meals && Array.isArray(todaysDiet.meals)) {
            // Calculate calories from diet history
            const totalCalories = todaysDiet.meals.reduce((sum, meal) => 
              sum + (meal.items ? meal.items.reduce((mealSum, item) => mealSum + (item.calories || 0), 0) : 0), 0)
            
            const consumedCalories = todaysDiet.meals.reduce((sum, meal) => 
              sum + (meal.items ? meal.items.reduce((mealSum, item) => 
                mealSum + (item.completed ? (item.calories || 0) : 0), 0) : 0), 0)
            
            // Get target calories from current diet plan if available
            const currentDietPlan = safeGetItem<{targetCalories?: number}>("currentDietPlan", {targetCalories: 2000})
            const targetCalories = currentDietPlan && typeof currentDietPlan.targetCalories === 'number' ? 
              currentDietPlan.targetCalories : 2000 // Default target
            
            setCalorieStats({
              consumed: Math.round(consumedCalories),
              total: targetCalories,
              percentage: targetCalories > 0 ? Math.min(100, Math.round((consumedCalories / targetCalories) * 100)) : 0
            })
          }
        }
      }
      
      // Get diet history for completion percentage
      const dietHistory = safeGetItem<DietDay[]>("dietHistory", [])
      if (Array.isArray(dietHistory) && dietHistory.length > 0) {
        const todaysDiet = dietHistory.find((item) => item && item.date === today)
        if (todaysDiet && todaysDiet.meals && Array.isArray(todaysDiet.meals)) {
          const totalItems = todaysDiet.meals.reduce(
            (sum: number, meal: Meal) => sum + (meal.items && Array.isArray(meal.items) ? meal.items.length : 0), 0
          )
          const completedItems = todaysDiet.meals.reduce(
            (sum: number, meal: Meal) => sum + (meal.items && Array.isArray(meal.items) ? 
              meal.items.filter((item: MealItem) => item.completed).length : 0), 0
          )
          setDietCompletion(totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0)
        }
      }
      
    } catch (error) {
      console.error("Error loading data from localStorage:", error)
    }
  }
  
  // Load data on mount
  useEffect(() => {
    loadData()
    
    // Set up refresh interval (every 30 seconds)
    const refreshInterval = setInterval(() => {
      loadData()
    }, 30000)
    
    // Set up visibility change listener to refresh data when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Clean up
    return () => {
      clearInterval(refreshInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
  
  // Get today's date
  const today = new Date()
  const options = { weekday: 'long', month: 'short', day: 'numeric' } as const
  const formattedDate = today.toLocaleDateString('en-US', options)
  
  // Get recent macro data (including today)
  const getRecentMacros = () => {
    if (macroHistory.length === 0) return []
    
    // macroHistory is already sorted by date (newest first)
    // Just take the first 3 entries
    return macroHistory.slice(0, 3)
  }
  
  const recentMacros = getRecentMacros()
  const hasHistory = recentMacros.length > 0
  
  // Calculate overall progress
  const overallProgress = Math.round((workoutCompletion + dietCompletion) / 2)
  
  return (
    <MobileLayout>
      <div className="container max-w-md mx-auto px-4 py-6 pb-20 space-y-6">
        {/* Header Section */}
        <PageHeader 
          title="Dashboard" 
          subtitle={formattedDate}
          action={
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
          }
        />
        
        {/* Hero Section */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-2xl">Welcome Back!</CardTitle>
            <CardDescription>Your fitness journey continues</CardDescription>
          </CardHeader>
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="relative h-20 w-20 flex items-center justify-center">
                <svg className="h-20 w-20 -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 36}
                    strokeDashoffset={2 * Math.PI * 36 * (1 - overallProgress / 100)}
                    className="text-primary transition-all duration-1000 ease-in-out"
                  />
                </svg>
                <span className="absolute text-2xl font-bold">{overallProgress}%</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Today's Progress</h3>
                <p className="text-sm text-muted-foreground">Keep pushing forward!</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0 pb-4">
            <Link href="/progress" className="flex items-center text-sm font-medium text-primary">
              View detailed progress <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </CardFooter>
        </Card>
        
        {/* Progress Tracking Section */}
        <div className="space-y-4">
          <SectionHeader 
            title="Progress Tracking" 
            description="Your daily fitness metrics"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="p-4 pb-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
                  <Dumbbell className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{workoutCompletion}%</p>
                <p className="text-xs text-muted-foreground">Workout Plan</p>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="p-4 pb-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
                  <Utensils className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{dietCompletion}%</p>
                <p className="text-xs text-muted-foreground">Diet Plan</p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Calorie Tracking Section */}
        <div className="space-y-4">
          <SectionHeader 
            title="Calorie Tracking" 
            description="Daily nutrition progress"
          />
          
          <Card className="border-none shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <Flame className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Daily Calories</CardTitle>
                <CardDescription>{calorieStats.consumed} / {calorieStats.total} kcal</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden mb-4">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-500 ease-in-out" 
                  style={{ width: `${calorieStats.percentage}%` }}
                ></div>
              </div>
              
              {/* Recent Macro History */}
              <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-card rounded-lg p-4 shadow">
                <h3 className="text-lg font-semibold mb-3">Recent Macro History</h3>
                <div className="space-y-3">
                  {getRecentMacros().length > 0 ? (
                    getRecentMacros().map((day, index) => {
                      // Check if this is today's date
                      const isToday = day.date === new Date().toISOString().split('T')[0]
                      
                      return (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {isToday ? (
                                <span className="text-primary font-bold">Today</span>
                              ) : (
                                new Date(day.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {Math.round(day.calories)} cal · {Math.round(day.protein)}g protein
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ 
                                  width: `${Math.min(100, Math.round((day.calories / (calorieStats.total || 2000)) * 100))}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {Math.min(100, Math.round((day.calories / (calorieStats.total || 2000)) * 100))}%
                            </span>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-muted-foreground">No recent data available</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Access Section */}
        <div className="space-y-4">
          <SectionHeader 
            title="Quick Access" 
            description="Jump to your fitness tools"
            action={
              <Button variant="ghost" size="sm" className="text-xs">
                View All
              </Button>
            }
          />
          
          <div className="grid grid-cols-2 gap-4">
            <CardLink 
              href="/workout" 
              icon={Dumbbell} 
              title="Workout Plan" 
              description="Track your exercises"
              className="hover:scale-[1.02] transition-transform"
            />
            
            <CardLink 
              href="/diet" 
              icon={Utensils} 
              title="Diet Plan" 
              description="Manage your meals"
              className="hover:scale-[1.02] transition-transform"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <CardLink 
              href="/progress" 
              icon={BarChart} 
              title="Progress" 
              description="View your results"
              className="hover:scale-[1.02] transition-transform"
            />
            
            <CardLink 
              href="/macros" 
              icon={Calendar} 
              title="Macro Tracker" 
              description="Log daily nutrition"
              className="hover:scale-[1.02] transition-transform"
            />
          </div>
        </div>
        
        {/* Achievement Section */}
        <div className="space-y-4">
          <SectionHeader 
            title="Recent Achievements"
            description="Your fitness milestones" 
          />
          
          <Card className="border-none shadow-sm bg-gradient-to-r from-primary/5 to-background">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Consistency Champion</h3>
                  <p className="text-xs text-muted-foreground">Completed 3 days in a row</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  )
}


