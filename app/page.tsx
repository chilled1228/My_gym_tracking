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

export default function Home() {
  const [workoutCompletion, setWorkoutCompletion] = useState(0)
  const [dietCompletion, setDietCompletion] = useState(0)
  const [calorieStats, setCalorieStats] = useState({
    consumed: 0,
    total: 0,
    percentage: 0
  })
  const [macroHistory, setMacroHistory] = useState<DailyMacros[]>([])
  
  // Load saved data from localStorage on component mount
  useEffect(() => {
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
      
      // Get diet completion
      const mealPlan = safeGetItem<Meal[]>("mealPlan", [])
      if (mealPlan.length > 0) {
        const totalItems = mealPlan.reduce((sum: number, meal: Meal) => sum + meal.items.length, 0)
        const completedItems = mealPlan.reduce(
          (sum: number, meal: Meal) => sum + meal.items.filter(item => item.completed).length, 
          0
        )
        setDietCompletion(totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0)
        
        // Calculate calories
        const totalCalories = mealPlan.reduce((sum: number, meal: Meal) => 
          sum + meal.items.reduce((mealSum: number, item: MealItem) => mealSum + item.calories, 0), 0)
        
        const consumedCalories = mealPlan.reduce((sum: number, meal: Meal) => 
          sum + meal.items.reduce((mealSum: number, item: MealItem) => 
            mealSum + (item.completed ? item.calories : 0), 0), 0)
        
        setCalorieStats({
          consumed: Math.round(consumedCalories),
          total: totalCalories,
          percentage: totalCalories > 0 ? Math.round((consumedCalories / totalCalories) * 100) : 0
        })
      }
      
      // Get macro history
      const history = safeGetItem<DailyMacros[]>("dietHistory", [])
      setMacroHistory(history)
    } catch (error) {
      console.error("Error loading data from localStorage:", error)
    }
  }, [])
  
  // Get today's date
  const today = new Date()
  const options = { weekday: 'long', month: 'short', day: 'numeric' } as const
  const formattedDate = today.toLocaleDateString('en-US', options)
  
  // Get last 3 days of macro data
  const getRecentMacros = () => {
    if (macroHistory.length === 0) return []
    
    const todayStr = today.toISOString().split('T')[0]
    const recentDays = macroHistory
      .filter(day => day.date !== todayStr) // Exclude today
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date descending
      .slice(0, 3) // Get last 3 days
    
    return recentDays
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
              
              {hasHistory && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-xs font-medium mb-3 flex items-center">
                    <TrendingUp className="h-3.5 w-3.5 mr-2 text-primary" />
                    Recent Macro History
                  </p>
                  <div className="space-y-3">
                    {recentMacros.map((day, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="font-medium">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="text-muted-foreground">{day.calories} kcal / {day.protein}g protein</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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


