"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight, PieChart, TrendingUp } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, startOfWeek, addDays, isSameDay, subDays, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from "date-fns"
import { Progress } from "@/components/ui/progress"
import { safeGetItem } from "@/lib/utils"

interface DailyMacros {
  date: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

export default function MacrosPage() {
  const [dailyHistory, setDailyHistory] = useState<DailyMacros[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [monthView, setMonthView] = useState<Date>(new Date())
  const [targetMacros, setTargetMacros] = useState({
    calories: 2500,
    protein: 180,
    carbs: 250,
    fats: 80
  })
  
  // Load saved data on mount
  useEffect(() => {
    loadMacroData();
    
    // Set up refresh interval (every 30 seconds)
    const refreshInterval = setInterval(() => {
      loadMacroData();
    }, 30000); // Refresh every 30 seconds
    
    // Set up visibility change listener to refresh data when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadMacroData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Function to load macro data from localStorage
  const loadMacroData = () => {
    try {
      const savedHistory = safeGetItem<DailyMacros[]>("macroHistory", []);
      if (savedHistory && Array.isArray(savedHistory)) {
        // Filter out any invalid entries
        const validHistory = savedHistory.filter(item => 
          item && typeof item === 'object' && item.date && 
          typeof item.calories === 'number' && 
          typeof item.protein === 'number' && 
          typeof item.carbs === 'number' && 
          typeof item.fats === 'number'
        );
        
        // Sort by date (newest first)
        const sortedHistory = [...validHistory].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        setDailyHistory(sortedHistory);
        console.log("Loaded macro history:", sortedHistory);
      }
    } catch (error) {
      console.error("Error loading macro data:", error);
    }
  };
  
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
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setMonthView(direction === 'next' ? addMonths(monthView, 1) : subMonths(monthView, 1))
  }
  
  const getMonthDays = (date: Date) => {
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    return eachDayOfInterval({ start, end })
  }
  
  const monthDays = getMonthDays(monthView)
  
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
  
  // Calculate averages for the selected week
  const calculateWeeklyAverages = () => {
    const weekData = weekDays.map(day => getDayData(day))
    const daysWithData = weekData.filter(day => day.calories > 0)
    
    if (daysWithData.length === 0) {
      return {
        avgCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFats: 0
      }
    }
    
    const totalCalories = daysWithData.reduce((sum, day) => sum + day.calories, 0)
    const totalProtein = daysWithData.reduce((sum, day) => sum + day.protein, 0)
    const totalCarbs = daysWithData.reduce((sum, day) => sum + day.carbs, 0)
    const totalFats = daysWithData.reduce((sum, day) => sum + day.fats, 0)
    
    return {
      avgCalories: Math.round(totalCalories / daysWithData.length),
      avgProtein: Math.round(totalProtein / daysWithData.length),
      avgCarbs: Math.round(totalCarbs / daysWithData.length),
      avgFats: Math.round(totalFats / daysWithData.length)
    }
  }
  
  const weeklyAverages = calculateWeeklyAverages()
  
  return (
    <MobileLayout>
      <div className="container max-w-md mx-auto px-3 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Macro Tracking</h1>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>
        
        <Tabs defaultValue="weekly" className="space-y-4">
          <TabsList className="grid grid-cols-3 h-auto p-1">
            <TabsTrigger value="weekly" className="text-xs py-2">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs py-2">Monthly</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs py-2">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="space-y-4 mt-2">
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Weekly View
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
                    <div className="grid grid-cols-7 gap-1 h-10">
                      {weekDays.map((day, index) => {
                        const dayData = getDayData(day)
                        const percentage = Math.min(100, Math.round((dayData.calories / targetMacros.calories) * 100))
                        
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
                    <div className="grid grid-cols-7 gap-1 h-10">
                      {weekDays.map((day, index) => {
                        const dayData = getDayData(day)
                        const percentage = Math.min(100, Math.round((dayData.protein / targetMacros.protein) * 100))
                        
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
                    <div className="grid grid-cols-7 gap-1 h-10">
                      {weekDays.map((day, index) => {
                        const dayData = getDayData(day)
                        const percentage = Math.min(100, Math.round((dayData.carbs / targetMacros.carbs) * 100))
                        
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
                    <div className="grid grid-cols-7 gap-1 h-10">
                      {weekDays.map((day, index) => {
                        const dayData = getDayData(day)
                        const percentage = Math.min(100, Math.round((dayData.fats / targetMacros.fats) * 100))
                        
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
                
                <div className="mt-6 pt-4 border-t">
                  <p className="text-xs font-medium mb-2">Weekly Averages</p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-muted-foreground">Avg. Calories: <span className="font-medium">{weeklyAverages.avgCalories} kcal</span></p>
                      <p className="text-muted-foreground">Avg. Protein: <span className="font-medium">{weeklyAverages.avgProtein}g</span></p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg. Carbs: <span className="font-medium">{weeklyAverages.avgCarbs}g</span></p>
                      <p className="text-muted-foreground">Avg. Fats: <span className="font-medium">{weeklyAverages.avgFats}g</span></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="monthly" className="space-y-4 mt-2">
            <Card className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(monthView, 'MMMM yyyy')}
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => navigateMonth('prev')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => navigateMonth('next')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  <div className="text-xs text-muted-foreground">Mon</div>
                  <div className="text-xs text-muted-foreground">Tue</div>
                  <div className="text-xs text-muted-foreground">Wed</div>
                  <div className="text-xs text-muted-foreground">Thu</div>
                  <div className="text-xs text-muted-foreground">Fri</div>
                  <div className="text-xs text-muted-foreground">Sat</div>
                  <div className="text-xs text-muted-foreground">Sun</div>
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: getStartOffset(monthView) }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-14 p-1"></div>
                  ))}
                  
                  {monthDays.map((day, index) => {
                    const dayData = getDayData(day)
                    const hasData = dayData.calories > 0
                    const caloriePercentage = Math.min(100, Math.round((dayData.calories / targetMacros.calories) * 100))
                    
                    return (
                      <div 
                        key={index} 
                        className={`h-14 p-1 rounded-md border ${isToday(day) ? 'border-primary' : 'border-transparent'} ${hasData ? 'bg-muted/20' : ''}`}
                      >
                        <div className="flex flex-col h-full">
                          <span className={`text-xs ${isToday(day) ? 'font-bold text-primary' : ''}`}>
                            {format(day, 'd')}
                          </span>
                          {hasData && (
                            <>
                              <div className="mt-auto text-[9px] text-muted-foreground">
                                {dayData.calories} kcal
                              </div>
                              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="bg-primary h-full" 
                                  style={{ width: `${caloriePercentage}%` }}
                                ></div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium mb-2">Monthly Summary</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-primary/30 mr-1"></div>
                      <span className="text-muted-foreground">Days tracked: {dailyHistory.filter(day => {
                        const date = new Date(day.date)
                        return date.getMonth() === monthView.getMonth() && 
                               date.getFullYear() === monthView.getFullYear() &&
                               day.calories > 0
                      }).length}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-primary mr-1"></div>
                      <span className="text-muted-foreground">Today</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-4 mt-2">
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
                    const caloriePercentage = Math.min(100, Math.round((dayData.calories / targetMacros.calories) * 100))
                    const proteinPercentage = Math.min(100, Math.round((dayData.protein / targetMacros.protein) * 100))
                    
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
                
                <div className="mt-6 pt-4 border-t">
                  <p className="text-xs font-medium mb-2">Macro Distribution</p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Protein</span>
                        <span>{Math.round(weeklyAverages.avgProtein * 4)} kcal ({Math.round((weeklyAverages.avgProtein * 4 / weeklyAverages.avgCalories) * 100)}%)</span>
                      </div>
                      <Progress value={Math.round((weeklyAverages.avgProtein * 4 / weeklyAverages.avgCalories) * 100)} className="h-2" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Carbs</span>
                        <span>{Math.round(weeklyAverages.avgCarbs * 4)} kcal ({Math.round((weeklyAverages.avgCarbs * 4 / weeklyAverages.avgCalories) * 100)}%)</span>
                      </div>
                      <Progress value={Math.round((weeklyAverages.avgCarbs * 4 / weeklyAverages.avgCalories) * 100)} className="h-2" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Fats</span>
                        <span>{Math.round(weeklyAverages.avgFats * 9)} kcal ({Math.round((weeklyAverages.avgFats * 9 / weeklyAverages.avgCalories) * 100)}%)</span>
                      </div>
                      <Progress value={Math.round((weeklyAverages.avgFats * 9 / weeklyAverages.avgCalories) * 100)} className="h-2" />
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

// Helper function to get the offset for the first day of the month
function getStartOffset(date: Date) {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  let dayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Convert to Monday-based (0 = Monday, 6 = Sunday)
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1
} 