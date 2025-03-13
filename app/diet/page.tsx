"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, PieChart, Calendar, ChevronLeft, ChevronRight, Check, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { MobileLayout } from "@/components/mobile-layout"
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, isAfter, isBefore, startOfDay } from "date-fns"
import { useSearchParams } from "next/navigation"
import { safeGetItem, safeSetItem } from "@/lib/utils"
import { useSyncIndicator } from "@/hooks/use-sync-indicator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

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
  calories: number
  protein: number
  carbs: number
  fats: number
}

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
  
  // Default meal template
  const defaultMealPlan: Meal[] = [
    {
      time: "5:30 AM",
      name: "Pre-Workout",
      items: [
        { name: "1 Banana", completed: false, calories: 105, protein: 1, carbs: 27, fats: 0 },
        { name: "5g Creatine with Water", completed: false, calories: 15, protein: 0, carbs: 3, fats: 0 },
      ],
      calories: 120,
      protein: 1,
      carbs: 30,
      fats: 0,
    },
    {
      time: "9:30 AM",
      name: "Post-Workout",
      items: [
        { name: "100g Soya Chunks", completed: false, calories: 345, protein: 52, carbs: 26, fats: 0.5 },
        { name: "200ml Milk", completed: false, calories: 65, protein: 3, carbs: 4, fats: 4.5 },
        { name: "3 Whole Eggs", completed: false, calories: 90, protein: 0, carbs: 0, fats: 10 },
      ],
      calories: 500,
      protein: 55,
      carbs: 30,
      fats: 15,
    },
    {
      time: "10:30 AM",
      name: "Breakfast",
      items: [
        { name: "100g Oats", completed: false, calories: 350, protein: 13, carbs: 60, fats: 7 },
        { name: "30g Peanut Butter", completed: false, calories: 85, protein: 14, carbs: 1, fats: 7 },
        { name: "200ml Milk", completed: false, calories: 65, protein: 3, carbs: 4, fats: 4 },
      ],
      calories: 500,
      protein: 30,
      carbs: 65,
      fats: 18,
    },
    {
      time: "2:00 PM",
      name: "Lunch",
      items: [
        { name: "150g Paneer", completed: false, calories: 400, protein: 40, carbs: 5, fats: 15 },
        { name: "100g Cooked Rice", completed: false, calories: 130, protein: 3, carbs: 45, fats: 0 },
        { name: "1 Bowl Vegetables", completed: false, calories: 70, protein: 7, carbs: 10, fats: 5 },
      ],
      calories: 600,
      protein: 50,
      carbs: 60,
      fats: 20,
    },
    {
      time: "6:00 PM",
      name: "Evening Snack",
      items: [
        { name: "3 Whole Eggs", completed: false, calories: 210, protein: 18, carbs: 0, fats: 15 },
        { name: "1 Whole Wheat Roti", completed: false, calories: 120, protein: 4, carbs: 20, fats: 0 },
        { name: "1 tsp Peanut Butter", completed: false, calories: 20, protein: 8, carbs: 5, fats: 0 },
      ],
      calories: 350,
      protein: 30,
      carbs: 25,
      fats: 15,
    },
    {
      time: "9:00 PM",
      name: "Dinner",
      items: [
        { name: "150g Chicken Breast", completed: false, calories: 300, protein: 50, carbs: 0, fats: 5 },
        { name: "1 Bowl Vegetables", completed: false, calories: 70, protein: 5, carbs: 10, fats: 3 },
        { name: "50g Rice / 1 Whole Wheat Roti", completed: false, calories: 130, protein: 0, carbs: 30, fats: 2 },
      ],
      calories: 500,
      protein: 55,
      carbs: 40,
      fats: 10,
    },
    {
      time: "11:30 PM",
      name: "Before Bed",
      items: [
        { name: "200ml Milk", completed: false, calories: 120, protein: 6, carbs: 10, fats: 5 },
      ],
      calories: 120,
      protein: 6,
      carbs: 10,
      fats: 5,
    },
  ]
  
  // State for current day's meals
  const [mealPlan, setMealPlan] = useState<Meal[]>(defaultMealPlan)
  
  // State for tracking diet by day
  const [dietDays, setDietDays] = useState<DietDay[]>([])
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [showNextWeekDialog, setShowNextWeekDialog] = useState(false)
  
  const [dailyHistory, setDailyHistory] = useState<DailyMacros[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  // Set active tab based on URL parameter
  useEffect(() => {
    if (tabParam && ['meals', 'macros', 'calendar'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Load saved diet data from localStorage on component mount
  useEffect(() => {
    // Load diet days
    const savedDietDays = safeGetItem<DietDay[]>("dietDays", [])
    if (savedDietDays.length > 0) {
      setDietDays(savedDietDays)
      
      // Find today's diet or the most recent one
      const today = new Date().toISOString().split('T')[0]
      const todaysDiet = savedDietDays.find(day => day.date === today)
      
      if (todaysDiet) {
        // If today's diet exists, use it
        setMealPlan(todaysDiet.meals)
        setCurrentDate(new Date(today))
      } else {
        // Find the most recent diet day
        const sortedDays = [...savedDietDays].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        
        if (sortedDays.length > 0) {
          const latestDate = new Date(sortedDays[0].date)
          
          // If the latest date is in the past, create a new day for today
          if (isBefore(latestDate, startOfDay(new Date()))) {
            createNewDietDay(today)
          } else {
            // Otherwise use the latest diet
            setMealPlan(sortedDays[0].meals)
            setCurrentDate(latestDate)
          }
        } else {
          // If no diet days exist, create one for today
          createNewDietDay(today)
        }
      }
    } else {
      // If no diet days exist, create one for today
      createNewDietDay(new Date().toISOString().split('T')[0])
    }
    
    // Load daily history
    const savedHistory = safeGetItem<DailyMacros[]>("dietHistory", [])
    if (savedHistory.length > 0) {
      setDailyHistory(savedHistory)
    }
    
    // Set active tab from URL if present
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])
  
  // Create a new diet day
  const createNewDietDay = (dateString: string) => {
    const newDietDay: DietDay = {
      date: dateString,
      meals: JSON.parse(JSON.stringify(defaultMealPlan)), // Deep clone default meals
      completed: false
    }
    
    setMealPlan(newDietDay.meals)
    setCurrentDate(new Date(dateString))
    
    // Add to diet days
    const updatedDietDays = [...dietDays, newDietDay]
    setDietDays(updatedDietDays)
    safeSetItem("dietDays", updatedDietDays)
  }
  
  // Navigate to a specific date
  const navigateToDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    const existingDietDay = dietDays.find(day => day.date === dateString)
    
    if (existingDietDay) {
      // If diet for this date exists, load it
      setMealPlan(existingDietDay.meals)
      setCurrentDate(date)
    } else {
      // Create a new diet day for this date
      createNewDietDay(dateString)
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
    navigateToDate(nextWeekDate)
    setShowNextWeekDialog(false)
  }

  const toggleMealItem = (mealIndex: number, itemIndex: number) => {
    const updatedMealPlan = [...mealPlan]
    updatedMealPlan[mealIndex].items[itemIndex].completed = !updatedMealPlan[mealIndex].items[itemIndex].completed
    setMealPlan(updatedMealPlan)
    
    // Update current diet day
    updateCurrentDietDay(updatedMealPlan)
    
    // Auto-save when toggling meal items
    autoSaveDietProgress(updatedMealPlan)
  }
  
  // Update the current diet day with new meal plan
  const updateCurrentDietDay = (meals: Meal[]) => {
    const dateString = currentDate.toISOString().split('T')[0]
    const updatedDietDays = [...dietDays]
    
    // Find the index of the current diet day
    const dayIndex = updatedDietDays.findIndex(day => day.date === dateString)
    
    if (dayIndex >= 0) {
      // Update existing day
      updatedDietDays[dayIndex].meals = meals
      
      // Check if all meals are completed
      const allCompleted = meals.every(meal => 
        meal.items.every(item => item.completed)
      )
      
      updatedDietDays[dayIndex].completed = allCompleted
    } else {
      // Add new day
      updatedDietDays.push({
        date: dateString,
        meals: meals,
        completed: false
      })
    }
    
    setDietDays(updatedDietDays)
    safeSetItem("dietDays", updatedDietDays)
  }
  
  // Function to update diet history with current day's data
  const updateDietHistory = (meals: Meal[]) => {
    const dateString = currentDate.toISOString().split('T')[0]
    
    // Calculate today's consumed macros
    const consumedCalories = meals.reduce((sum, meal) => 
      sum + meal.items.reduce((mealSum, item) => 
        mealSum + (item.completed ? item.calories : 0), 0), 0)
    
    const consumedProtein = meals.reduce((sum, meal) => 
      sum + meal.items.reduce((mealSum, item) => 
        mealSum + (item.completed ? item.protein : 0), 0), 0)
    
    const consumedCarbs = meals.reduce((sum, meal) => 
      sum + meal.items.reduce((mealSum, item) => 
        mealSum + (item.completed ? item.carbs : 0), 0), 0)
    
    const consumedFats = meals.reduce((sum, meal) => 
      sum + meal.items.reduce((mealSum, item) => 
        mealSum + (item.completed ? item.fats : 0), 0), 0)
    
    // Check if this date's entry already exists
    const updatedHistory = [...dailyHistory]
    const dayIndex = updatedHistory.findIndex(day => day.date === dateString)
    
    if (dayIndex >= 0) {
      // Update existing entry
      updatedHistory[dayIndex] = {
        date: dateString,
        calories: Math.round(consumedCalories),
        protein: Math.round(consumedProtein),
        carbs: Math.round(consumedCarbs),
        fats: Math.round(consumedFats)
      }
    } else {
      // Add new entry
      updatedHistory.push({
        date: dateString,
        calories: Math.round(consumedCalories),
        protein: Math.round(consumedProtein),
        carbs: Math.round(consumedCarbs),
        fats: Math.round(consumedFats)
      })
    }
    
    // Sort by date (newest first)
    updatedHistory.sort((a, b) => {
      return parseISO(b.date).getTime() - parseISO(a.date).getTime()
    })
    
    // Update state and save to localStorage
    setDailyHistory(updatedHistory)
    safeSetItem("dietHistory", updatedHistory)
  }
  
  // Auto-save function with debounce
  const autoSaveDietProgress = (meals: Meal[]) => {
    // Update diet history
    updateDietHistory(meals)
    
    // Show sync indicator
    showSyncIndicator()
  }

  const saveProgress = () => {
    try {
      // Update current diet day
      updateCurrentDietDay(mealPlan)
      
      // Update diet history
      updateDietHistory(mealPlan)
      
      // Show sync indicator
      showSyncIndicator()
      
      toast({
        title: "Progress saved",
        description: "Your diet progress has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving diet data:", error)
      toast({
        title: "Error saving progress",
        description: "There was a problem saving your data. Please try again.",
        variant: "destructive"
      })
    }
  }

  const resetDay = () => {
    const updatedMealPlan = [...mealPlan]
    updatedMealPlan.forEach(meal => {
      meal.items.forEach(item => {
        item.completed = false
      })
    })
    setMealPlan(updatedMealPlan)
    
    // Update current diet day
    updateCurrentDietDay(updatedMealPlan)
    
    // Update diet history
    updateDietHistory(updatedMealPlan)
    
    toast({
      title: "Day reset",
      description: "All meal items have been reset.",
    })
  }

  // Calculate total calories and macros
  const totalCalories = mealPlan.reduce((sum, meal) => 
    sum + meal.items.reduce((mealSum, item) => mealSum + item.calories, 0), 0)
  
  const totalProtein = mealPlan.reduce((sum, meal) => 
    sum + meal.items.reduce((mealSum, item) => mealSum + item.protein, 0), 0)
  
  const totalCarbs = mealPlan.reduce((sum, meal) => 
    sum + meal.items.reduce((mealSum, item) => mealSum + item.carbs, 0), 0)
  
  const totalFats = mealPlan.reduce((sum, meal) => 
    sum + meal.items.reduce((mealSum, item) => mealSum + item.fats, 0), 0)

  // Calculate consumed calories and macros based on completed items
  const consumedCalories = mealPlan.reduce((sum, meal) => 
    sum + meal.items.reduce((mealSum, item) => 
      mealSum + (item.completed ? item.calories : 0), 0), 0)
  
  const consumedProtein = mealPlan.reduce((sum, meal) => 
    sum + meal.items.reduce((mealSum, item) => 
      mealSum + (item.completed ? item.protein : 0), 0), 0)
  
  const consumedCarbs = mealPlan.reduce((sum, meal) => 
    sum + meal.items.reduce((mealSum, item) => 
      mealSum + (item.completed ? item.carbs : 0), 0), 0)
  
  const consumedFats = mealPlan.reduce((sum, meal) => 
    sum + meal.items.reduce((mealSum, item) => 
      mealSum + (item.completed ? item.fats : 0), 0), 0)

  // Calculate completion percentages
  const caloriesPercentage = Math.round((consumedCalories / totalCalories) * 100) || 0
  const proteinPercentage = Math.round((consumedProtein / totalProtein) * 100) || 0
  const carbsPercentage = Math.round((consumedCarbs / totalCarbs) * 100) || 0
  const fatsPercentage = Math.round((consumedFats / totalFats) * 100) || 0

  // Calculate meal-specific consumed calories and macros
  const getMealConsumedCalories = (mealIndex: number) => {
    return mealPlan[mealIndex].items.reduce(
      (sum, item) => sum + (item.completed ? item.calories : 0), 0
    )
  }

  const getMealConsumedProtein = (mealIndex: number) => {
    return mealPlan[mealIndex].items.reduce(
      (sum, item) => sum + (item.completed ? item.protein : 0), 0
    )
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
  
  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }
  
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
  
  // Format date for display
  const formatCurrentDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy')
  }

  return (
    <MobileLayout>
      <div className="container max-w-md mx-auto px-3 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Diet Plan</h1>
          <div className="flex items-center space-x-2">
            <Button onClick={saveProgress} variant="outline" size="sm" className="h-8">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button onClick={resetDay} variant="ghost" size="sm" className="h-8">
              Reset
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
                {isDietCompleted(currentDate) && (
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 h-auto p-1">
            <TabsTrigger value="meals" className="text-xs py-2">Meals</TabsTrigger>
            <TabsTrigger value="macros" className="text-xs py-2">Macros</TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs py-2">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="macros" className="space-y-4 mt-2">
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base flex items-center">
                  <PieChart className="h-4 w-4 mr-2" />
                  Today's Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Calories</span>
                    <span>{Math.round(consumedCalories)} / {totalCalories} kcal</span>
                  </div>
                  <Progress value={caloriesPercentage} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Protein</span>
                    <span>{Math.round(consumedProtein)} / {totalProtein}g</span>
                  </div>
                  <Progress value={proteinPercentage} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Carbs</span>
                    <span>{Math.round(consumedCarbs)} / {totalCarbs}g</span>
                  </div>
                  <Progress value={carbsPercentage} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Fats</span>
                    <span>{Math.round(consumedFats)} / {totalFats}g</span>
                  </div>
                  <Progress value={fatsPercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base">Diet Plan Benefits</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="bg-muted rounded-full px-2 py-1">✅ Balanced diet</div>
                  <div className="bg-muted rounded-full px-2 py-1">✅ High protein</div>
                  <div className="bg-muted rounded-full px-2 py-1">✅ Budget-friendly</div>
                  <div className="bg-muted rounded-full px-2 py-1">✅ Nutrient timing</div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={resetDay} className="h-8 text-xs">
                Reset All Meals
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="meals" className="space-y-4 mt-2">
            {mealPlan.map((meal, mealIndex) => {
              const consumedMealCalories = getMealConsumedCalories(mealIndex)
              const consumedMealProtein = getMealConsumedProtein(mealIndex)
              const totalMealCalories = meal.items.reduce((sum, item) => sum + item.calories, 0)
              const totalMealProtein = meal.items.reduce((sum, item) => sum + item.protein, 0)
              
              return (
                <Card key={mealIndex} className="shadow-sm overflow-hidden">
                  <CardHeader className="py-2 px-4 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-sm">{meal.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{meal.time}</p>
                      </div>
                      <div className="text-xs text-right">
                        <p>{consumedMealCalories} / {totalMealCalories} kcal</p>
                        <p className="text-muted-foreground">{consumedMealProtein} / {totalMealProtein}g protein</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {meal.items.map((item, itemIndex) => (
                        <div 
                          key={itemIndex} 
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={`meal-${mealIndex}-item-${itemIndex}`}
                            checked={item.completed}
                            onCheckedChange={() => toggleMealItem(mealIndex, itemIndex)}
                            className="h-5 w-5"
                          />
                          <div className="flex-grow">
                            <label
                              htmlFor={`meal-${mealIndex}-item-${itemIndex}`}
                              className={`flex-grow cursor-pointer text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}
                            >
                              {item.name}
                            </label>
                            <div className="flex text-xs text-muted-foreground">
                              <span>{item.calories} kcal</span>
                              <span className="mx-2">•</span>
                              <span>{item.protein}g protein</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>
          
          <TabsContent value="calendar" className="space-y-4 mt-2">
            <Card className="shadow-sm">
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
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {weekDays.map((day, index) => (
                    <div 
                      key={index} 
                      className={`text-center p-1 rounded-md cursor-pointer ${
                        isSameDay(day, currentDate) ? 'bg-primary/20' : 
                        isToday(day) ? 'bg-primary/10' : 
                        hasDietPlan(day) ? 'bg-muted/30' : ''
                      }`}
                      onClick={() => navigateToDate(day)}
                    >
                      <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
                      <p className={`text-xs font-medium ${
                        isSameDay(day, currentDate) ? 'text-primary' : 
                        isToday(day) ? 'text-primary' : ''
                      }`}>
                        {format(day, 'd')}
                      </p>
                      {isDietCompleted(day) && (
                        <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Calories (kcal)</p>
                    <div className="grid grid-cols-7 gap-1 h-8">
                      {weekDays.map((day, index) => {
                        const dayData = getDayData(day)
                        const percentage = Math.min(100, Math.round((dayData.calories / totalCalories) * 100))
                        
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
                        const percentage = Math.min(100, Math.round((dayData.protein / totalProtein) * 100))
                        
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
                        const percentage = Math.min(100, Math.round((dayData.carbs / totalCarbs) * 100))
                        
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
                        const percentage = Math.min(100, Math.round((dayData.fats / totalFats) * 100))
                        
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
                      <p className="text-muted-foreground">Calories: <span className="font-medium">{totalCalories} kcal</span></p>
                      <p className="text-muted-foreground">Protein: <span className="font-medium">{totalProtein}g</span></p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Carbs: <span className="font-medium">{totalCarbs}g</span></p>
                      <p className="text-muted-foreground">Fats: <span className="font-medium">{totalFats}g</span></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add a success indicator when data is synced */}
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
                Moving to the next week will create a new diet plan for the upcoming days.
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
      </div>
    </MobileLayout>
  )
}

// Main page component with Suspense boundary
export default function DietPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DietPageContent />
    </Suspense>
  )
}


