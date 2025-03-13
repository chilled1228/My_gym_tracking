"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, PieChart, Calendar, ChevronLeft, ChevronRight, Check, ArrowRight, Trash2, Utensils } from "lucide-react"
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
    deleteAllDietPlans
  } = usePlanManager()
  
  // State for tracking the current date and diet
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [currentDietDay, setCurrentDietDay] = useState<DietDay | null>(null)
  const [dietHistory, setDietHistory] = useState<DietDay[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showWeeklyView, setShowWeeklyView] = useState(false)
  
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
    if (!currentDietPlan || !currentDietPlan.meals) {
      console.error("Cannot create diet day: current diet plan is invalid", currentDietPlan)
      return
    }
    
    try {
      // Deep clone the meals from the current diet plan
      const meals = JSON.parse(JSON.stringify(currentDietPlan.meals))
      
      // Ensure each meal has the required properties
      const validatedMeals = meals.map((meal: Meal) => {
        // Ensure meal has items array
        if (!meal.items) {
          meal.items = []
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
    } catch (error) {
      console.error("Error creating new diet day:", error)
      
      // Create an empty diet day as fallback
      const emptyDietDay: DietDay = {
        date: dateString,
        meals: [],
        completed: false,
      }
      
      setCurrentDietDay(emptyDietDay)
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
    
    // Add defensive checks
    if (!currentDietDay.meals || 
        !currentDietDay.meals[mealIndex] || 
        !currentDietDay.meals[mealIndex].items || 
        !currentDietDay.meals[mealIndex].items[itemIndex]) {
      console.error("Attempted to toggle a meal item that doesn't exist:", { mealIndex, itemIndex })
      return
    }
    
    const updatedDietDay = { ...currentDietDay }
    updatedDietDay.meals[mealIndex].items[itemIndex].completed = 
      !updatedDietDay.meals[mealIndex].items[itemIndex].completed
    
    // Check if all meal items are completed
    const allCompleted = updatedDietDay.meals.every(meal => 
      meal.items && meal.items.every(item => item.completed)
    )
    updatedDietDay.completed = allCompleted
    
    setCurrentDietDay(updatedDietDay)
    updateCurrentDietDay(updatedDietDay.meals)
  }
  
  // Update functions
  const updateCurrentDietDay = (meals: Meal[]) => {
    if (!currentDietDay || !meals) return
    
    // Check if all meal items are completed
    const allCompleted = meals.every(meal => 
      meal.items && meal.items.every(item => item.completed)
    )
    
    const updatedDietDay: DietDay = {
      ...currentDietDay,
      meals,
      completed: allCompleted,
    }
    
    // Update diet history
    updateDietHistory(meals)
    
    // Auto-save progress
    autoSaveDietProgress(meals)
  }
  
  const updateDietHistory = (meals: Meal[]) => {
    if (!currentDietDay || !meals) return
    
    const updatedHistory = [...dietHistory]
    const existingIndex = updatedHistory.findIndex(
      (item) => item.date === currentDietDay.date
    )
    
    // Check if all meal items are completed
    const allCompleted = meals.every(meal => 
      meal.items && meal.items.every(item => item.completed)
    )
    
    if (existingIndex >= 0) {
      updatedHistory[existingIndex] = {
        ...updatedHistory[existingIndex],
        meals,
        completed: allCompleted,
      }
    } else {
      updatedHistory.push({
        date: currentDietDay.date,
        meals,
        completed: allCompleted,
      })
    }
    
    setDietHistory(updatedHistory)
  }
  
  const autoSaveDietProgress = (meals: Meal[]) => {
    if (!currentDietDay || !meals) return
    
    const updatedHistory = [...dietHistory]
    const existingIndex = updatedHistory.findIndex(
      (item) => item.date === currentDietDay.date
    )
    
    // Check if all meal items are completed
    const allCompleted = meals.every(meal => 
      meal.items && meal.items.every(item => item.completed)
    )
    
    if (existingIndex >= 0) {
      updatedHistory[existingIndex] = {
        ...updatedHistory[existingIndex],
        meals,
        completed: allCompleted,
      }
    } else {
      updatedHistory.push({
        date: currentDietDay.date,
        meals,
        completed: allCompleted,
      })
    }
    
    safeSetItem("dietHistory", updatedHistory)
    setLastSaved(new Date())
    showSyncIndicator()
  }
  
  const saveProgress = () => {
    if (!currentDietDay) return
    
    setIsSaving(true)
    
    try {
      // Save diet history to localStorage
      safeSetItem("dietHistory", dietHistory)
      
      // Update last saved timestamp
      setLastSaved(new Date())
      
      // Show sync indicator
      showSyncIndicator()
      
      // Show success toast
      toast({
        title: "Progress Saved",
        description: "Your diet progress has been saved successfully.",
      })
    } catch (error) {
      // Show error toast
      toast({
        title: "Error Saving Progress",
        description: "There was an error saving your progress. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const resetDay = () => {
    if (!currentDietDay) return
    
    // Create a new diet day based on the current plan
    const dateString = currentDate.toISOString().split('T')[0]
    createNewDietDay(dateString)
    
    // Update diet history
    const updatedHistory = dietHistory.filter(
      (diet) => diet.date !== dateString
    )
    
    setDietHistory(updatedHistory)
    safeSetItem("dietHistory", updatedHistory)
    
    // Show success toast
    toast({
      title: "Day Reset",
      description: "Your diet for today has been reset.",
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
    if (confirm("Are you sure you want to delete all diet plans? This will remove all custom diet plans and reset to the default plans. This action cannot be undone.")) {
      // Delete all diet plans
      deleteAllDietPlans()
      
      // Clear the diet history for the current day
      const dateString = currentDate.toISOString().split('T')[0]
      const updatedHistory = dietHistory.filter(
        (diet) => diet.date !== dateString
      )
      setDietHistory(updatedHistory)
      safeSetItem("dietHistory", updatedHistory)
      
      // Force refresh of the current diet day with the default plan
      setTimeout(() => {
        createNewDietDay(dateString)
      }, 100)
      
      toast({
        title: "Diet Plans Deleted",
        description: "All custom diet plans have been deleted. Default plans have been restored.",
      })
    }
  }
  
  // Render the diet page
  return (
    <MobileLayout>
      <div className="container px-2 sm:px-4 mx-auto pt-4 pb-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-4">Diet Tracker</h1>
          
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


