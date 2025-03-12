"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, TrendingUp, Calendar, Dumbbell, Utensils, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MobileLayout } from "@/components/mobile-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, startOfWeek, addDays, isSameDay, subDays } from "date-fns"

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

export default function ProgressPage() {
  const { toast } = useToast()
  const [workoutStats, setWorkoutStats] = useState({
    totalExercises: 0,
    completedExercises: 0,
    completionPercentage: 0
  })
  
  const [dietStats, setDietStats] = useState({
    totalItems: 0,
    completedItems: 0,
    completionPercentage: 0,
    consumedCalories: 0,
    totalCalories: 0,
    consumedProtein: 0,
    totalProtein: 0,
    consumedCarbs: 0,
    totalCarbs: 0,
    consumedFats: 0,
    totalFats: 0
  })
  
  const [dailyHistory, setDailyHistory] = useState<DailyMacros[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  // Load saved data from localStorage on component mount
  useEffect(() => {
    // Get workout stats
    const savedWorkout = localStorage.getItem("workoutPlan")
    if (savedWorkout) {
      const workoutPlan: WorkoutDay[] = JSON.parse(savedWorkout)
      const totalExercises = workoutPlan.reduce((sum: number, day: WorkoutDay) => sum + day.exercises.length, 0)
      const completedExercises = workoutPlan.reduce(
        (sum: number, day: WorkoutDay) => sum + day.exercises.filter(ex => ex.completed).length, 
        0
      )
      const completionPercentage = Math.round((completedExercises / totalExercises) * 100)
      
      setWorkoutStats({
        totalExercises,
        completedExercises,
        completionPercentage
      })
    }
    
    // Get diet stats
    const savedMeals = localStorage.getItem("mealPlan")
    if (savedMeals) {
      const mealPlan: Meal[] = JSON.parse(savedMeals)
      const totalItems = mealPlan.reduce((sum: number, meal: Meal) => sum + meal.items.length, 0)
      const completedItems = mealPlan.reduce(
        (sum: number, meal: Meal) => sum + meal.items.filter(item => item.completed).length, 
        0
      )
      const completionPercentage = Math.round((completedItems / totalItems) * 100)
      
      // Calculate total calories and macros
      const totalCalories = mealPlan.reduce((sum: number, meal: Meal) => 
        sum + meal.items.reduce((mealSum: number, item: MealItem) => mealSum + item.calories, 0), 0)
      
      const totalProtein = mealPlan.reduce((sum: number, meal: Meal) => 
        sum + meal.items.reduce((mealSum: number, item: MealItem) => mealSum + item.protein, 0), 0)
      
      const totalCarbs = mealPlan.reduce((sum: number, meal: Meal) => 
        sum + meal.items.reduce((mealSum: number, item: MealItem) => mealSum + item.carbs, 0), 0)
      
      const totalFats = mealPlan.reduce((sum: number, meal: Meal) => 
        sum + meal.items.reduce((mealSum: number, item: MealItem) => mealSum + item.fats, 0), 0)
      
      // Calculate consumed calories and macros
      const consumedCalories = mealPlan.reduce((sum: number, meal: Meal) => 
        sum + meal.items.reduce((mealSum: number, item: MealItem) => 
          mealSum + (item.completed ? item.calories : 0), 0), 0)
      
      const consumedProtein = mealPlan.reduce((sum: number, meal: Meal) => 
        sum + meal.items.reduce((mealSum: number, item: MealItem) => 
          mealSum + (item.completed ? item.protein : 0), 0), 0)
      
      const consumedCarbs = mealPlan.reduce((sum: number, meal: Meal) => 
        sum + meal.items.reduce((mealSum: number, item: MealItem) => 
          mealSum + (item.completed ? item.carbs : 0), 0), 0)
      
      const consumedFats = mealPlan.reduce((sum: number, meal: Meal) => 
        sum + meal.items.reduce((mealSum: number, item: MealItem) => 
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
    
    // Get daily history
    const savedHistory = localStorage.getItem("dietHistory")
    if (savedHistory) {
      setDailyHistory(JSON.parse(savedHistory))
    } else {
      // Initialize with some sample data for the past 14 days
      const today = new Date()
      const initialHistory: DailyMacros[] = []
      
      for (let i = 13; i >= 0; i--) {
        const date = new Date()
        date.setDate(today.getDate() - i)
        
        // Generate some random data for demonstration
        const randomPercentage = Math.random() * 0.3 + 0.7 // 70-100% completion
        
        initialHistory.push({
          date: date.toISOString().split('T')[0],
          calories: Math.round(dietStats.totalCalories * (i === 0 ? 0 : randomPercentage)),
          protein: Math.round(dietStats.totalProtein * (i === 0 ? 0 : randomPercentage)),
          carbs: Math.round(dietStats.totalCarbs * (i === 0 ? 0 : randomPercentage)),
          fats: Math.round(dietStats.totalFats * (i === 0 ? 0 : randomPercentage))
        })
      }
      
      setDailyHistory(initialHistory)
      localStorage.setItem("dietHistory", JSON.stringify(initialHistory))
    }
  }, [])
  
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
  
  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
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
        
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="grid grid-cols-3 h-auto p-1">
            <TabsTrigger value="summary" className="text-xs py-2">Summary</TabsTrigger>
            <TabsTrigger value="history" className="text-xs py-2">History</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs py-2">Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4 mt-2">
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base flex items-center">
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Workout Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">Completion</p>
                    <p className="text-xs text-muted-foreground">
                      {workoutStats.completedExercises} of {workoutStats.totalExercises} exercises
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{workoutStats.completionPercentage}%</p>
                  </div>
                </div>
                
                <div className="w-full bg-muted/50 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${workoutStats.completionPercentage}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base flex items-center">
                  <Utensils className="h-4 w-4 mr-2" />
                  Diet Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">Completion</p>
                    <p className="text-xs text-muted-foreground">
                      {dietStats.completedItems} of {dietStats.totalItems} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{dietStats.completionPercentage}%</p>
                  </div>
                </div>
                
                <div className="w-full bg-muted/50 rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${dietStats.completionPercentage}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Calories</p>
                    <p className="text-sm font-medium">
                      {dietStats.consumedCalories} / {dietStats.totalCalories} kcal
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Protein</p>
                    <p className="text-sm font-medium">
                      {dietStats.consumedProtein} / {dietStats.totalProtein}g
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                    <p className="text-sm font-medium">
                      {dietStats.consumedCarbs} / {dietStats.totalCarbs}g
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fats</p>
                    <p className="text-sm font-medium">
                      {dietStats.consumedFats} / {dietStats.totalFats}g
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4 mt-2">
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Weekly Macros
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
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day, index) => (
                    <div key={index} className="text-center">
                      <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
                      <p className={`text-xs font-medium ${isToday(day) ? 'text-primary' : ''}`}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Calories (kcal)</p>
                    <div className="grid grid-cols-7 gap-1 h-8">
                      {weekDays.map((day, index) => {
                        const dayData = getDayData(day)
                        const percentage = Math.min(100, Math.round((dayData.calories / dietStats.totalCalories) * 100))
                        
                        return (
                          <div key={index} className="relative h-full flex flex-col justify-end">
                            <div 
                              className={`w-full bg-primary/20 rounded-sm ${isToday(day) ? 'bg-primary/30' : ''}`}
                              style={{ height: `${percentage}%` }}
                            ></div>
                            <span className="absolute bottom-0 left-0 right-0 text-[10px] text-center">
                              {dayData.calories}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Protein (g)</p>
                    <div className="grid grid-cols-7 gap-1 h-8">
                      {weekDays.map((day, index) => {
                        const dayData = getDayData(day)
                        const percentage = Math.min(100, Math.round((dayData.protein / dietStats.totalProtein) * 100))
                        
                        return (
                          <div key={index} className="relative h-full flex flex-col justify-end">
                            <div 
                              className={`w-full bg-blue-500/20 rounded-sm ${isToday(day) ? 'bg-blue-500/30' : ''}`}
                              style={{ height: `${percentage}%` }}
                            ></div>
                            <span className="absolute bottom-0 left-0 right-0 text-[10px] text-center">
                              {dayData.protein}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Carbs (g)</p>
                    <div className="grid grid-cols-7 gap-1 h-8">
                      {weekDays.map((day, index) => {
                        const dayData = getDayData(day)
                        const percentage = Math.min(100, Math.round((dayData.carbs / dietStats.totalCarbs) * 100))
                        
                        return (
                          <div key={index} className="relative h-full flex flex-col justify-end">
                            <div 
                              className={`w-full bg-green-500/20 rounded-sm ${isToday(day) ? 'bg-green-500/30' : ''}`}
                              style={{ height: `${percentage}%` }}
                            ></div>
                            <span className="absolute bottom-0 left-0 right-0 text-[10px] text-center">
                              {dayData.carbs}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Fats (g)</p>
                    <div className="grid grid-cols-7 gap-1 h-8">
                      {weekDays.map((day, index) => {
                        const dayData = getDayData(day)
                        const percentage = Math.min(100, Math.round((dayData.fats / dietStats.totalFats) * 100))
                        
                        return (
                          <div key={index} className="relative h-full flex flex-col justify-end">
                            <div 
                              className={`w-full bg-yellow-500/20 rounded-sm ${isToday(day) ? 'bg-yellow-500/30' : ''}`}
                              style={{ height: `${percentage}%` }}
                            ></div>
                            <span className="absolute bottom-0 left-0 right-0 text-[10px] text-center">
                              {dayData.fats}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium mb-2">Daily Targets</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Calories: <span className="font-medium">{dietStats.totalCalories} kcal</span></p>
                      <p className="text-muted-foreground">Protein: <span className="font-medium">{dietStats.totalProtein}g</span></p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Carbs: <span className="font-medium">{dietStats.totalCarbs}g</span></p>
                      <p className="text-muted-foreground">Fats: <span className="font-medium">{dietStats.totalFats}g</span></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  7-Day Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="space-y-4">
                  {last7Days.map((day, index) => {
                    const dayData = getDayData(day)
                    const caloriePercentage = Math.min(100, Math.round((dayData.calories / dietStats.totalCalories) * 100))
                    const proteinPercentage = Math.min(100, Math.round((dayData.protein / dietStats.totalProtein) * 100))
                    
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-medium">
                            {isToday(day) ? 'Today' : format(day, 'EEE, MMM d')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dayData.calories} kcal / {dayData.protein}g protein
                          </p>
                        </div>
                        <div className="flex space-x-1 h-2">
                          <div className="w-3/4 bg-muted/50 rounded-full overflow-hidden">
                            <div 
                              className="bg-primary h-full rounded-full" 
                              style={{ width: `${caloriePercentage}%` }}
                            ></div>
                          </div>
                          <div className="w-1/4 bg-muted/50 rounded-full overflow-hidden">
                            <div 
                              className="bg-blue-500 h-full rounded-full" 
                              style={{ width: `${proteinPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-1"></div>
                    <span>Calories</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                    <span>Protein</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stats" className="space-y-4 mt-2">
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base">Weekly Stats</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Weekly statistics will be available soon.
                </p>
                <div className="flex items-center justify-center h-32">
                  <Calendar className="h-12 w-12 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  )
}

