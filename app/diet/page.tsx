"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, PieChart, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { MobileLayout } from "@/components/mobile-layout"
import { format, startOfWeek, addDays, isSameDay } from "date-fns"
import { useSearchParams } from "next/navigation"
import { safeGetItem, safeSetItem } from "@/lib/utils"

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

export default function DietPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<string>("meals")
  const [mealPlan, setMealPlan] = useState<Meal[]>([
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
  ])
  
  const [dailyHistory, setDailyHistory] = useState<DailyMacros[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  // Set active tab based on URL parameter
  useEffect(() => {
    if (tabParam && ['meals', 'macros', 'calendar'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Load saved meal data from localStorage on component mount
  useEffect(() => {
    const savedMealPlan = safeGetItem<Meal[]>("mealPlan", []);
    if (savedMealPlan.length > 0) {
      setMealPlan(savedMealPlan);
    }
    
    const savedHistory = safeGetItem<DailyMacros[]>("dietHistory", []);
    setDailyHistory(savedHistory);
  }, [])

  const toggleMealItem = (mealIndex: number, itemIndex: number) => {
    const updatedMealPlan = [...mealPlan]
    updatedMealPlan[mealIndex].items[itemIndex].completed = !updatedMealPlan[mealIndex].items[itemIndex].completed
    setMealPlan(updatedMealPlan)
  }

  const saveProgress = () => {
    try {
      const saveSuccess = safeSetItem("mealPlan", mealPlan);
      
      // Update daily history with today's data
      const today = new Date().toISOString().split('T')[0]
      const updatedHistory = [...dailyHistory]
      const todayIndex = updatedHistory.findIndex(day => day.date === today)
      
      const todayEntry = {
        date: today,
        calories: Math.round(consumedCalories),
        protein: Math.round(consumedProtein),
        carbs: Math.round(consumedCarbs),
        fats: Math.round(consumedFats)
      }
      
      if (todayIndex >= 0) {
        updatedHistory[todayIndex] = todayEntry
      } else {
        updatedHistory.push(todayEntry)
      }
      
      setDailyHistory(updatedHistory)
      const historySuccess = safeSetItem("dietHistory", updatedHistory);
      
      if (saveSuccess && historySuccess) {
        toast({
          title: "Progress saved",
          description: "Your meal progress has been saved successfully.",
        })
      } else {
        throw new Error("Failed to save data to localStorage");
      }
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
    updatedMealPlan.forEach((meal) => {
      meal.items.forEach((item) => {
        item.completed = false
      })
    })
    setMealPlan(updatedMealPlan)
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

  return (
    <MobileLayout>
      <div className="container max-w-md mx-auto px-3 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Diet Plan</h1>
          <Button onClick={saveProgress} variant="ghost" size="icon" className="h-8 w-8">
            <Save className="h-4 w-4" />
          </Button>
        </div>

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
      </div>
    </MobileLayout>
  )
}


