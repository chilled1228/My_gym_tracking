"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, Utensils, BarChart, TrendingUp, Calendar } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { useEffect, useState } from "react"
import { safeGetItem } from "@/lib/utils"

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
  
  return (
    <MobileLayout>
      <div className="container max-w-md mx-auto px-3 py-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>
        
        <Card className="mb-4 shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Today's Progress</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                  <Dumbbell className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">{workoutCompletion}%</p>
                <p className="text-xs text-muted-foreground">Workout</p>
              </div>
              
              <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                  <Utensils className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">{dietCompletion}%</p>
                <p className="text-xs text-muted-foreground">Diet</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs">Calories</p>
                <p className="text-xs">{calorieStats.consumed} / {calorieStats.total} kcal</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${calorieStats.percentage}%` }}
                ></div>
              </div>
            </div>
            
            {hasHistory && (
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs mb-2">Recent Macro History</p>
                <div className="space-y-2">
                  {recentMacros.map((day, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className="text-muted-foreground">{day.calories} kcal / {day.protein}g protein</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link href="/workout" className="w-full">
            <Card className="shadow-sm h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <Dumbbell className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-medium text-center">Workout Plan</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/diet" className="w-full">
            <Card className="shadow-sm h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <Utensils className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-medium text-center">Diet Plan</p>
              </CardContent>
            </Card>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Link href="/progress" className="w-full">
            <Card className="shadow-sm h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <BarChart className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-medium text-center">Progress</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/macros" className="w-full">
            <Card className="shadow-sm h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <Calendar className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-medium text-center">Macro Tracker</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </MobileLayout>
  )
}

