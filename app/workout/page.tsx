"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MobileLayout } from "@/components/mobile-layout"
import { safeGetItem, safeSetItem } from "@/lib/utils"

interface Exercise {
  name: string
  sets: string
  completed: boolean
}

interface WorkoutDay {
  name: string
  exercises: Exercise[]
}

export default function WorkoutPage() {
  const { toast } = useToast()
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutDay[]>([
    {
      name: "Day 1: Chest & Triceps",
      exercises: [
        { name: "Bench Press", sets: "4x8-10", completed: false },
        { name: "Incline Dumbbell Press", sets: "4x8-10", completed: false },
        { name: "Cable Flys", sets: "3x12", completed: false },
        { name: "Dips", sets: "3x10", completed: false },
        { name: "Skull Crushers", sets: "4x10", completed: false },
        { name: "Rope Triceps Pushdown", sets: "3x12", completed: false },
      ],
    },
    {
      name: "Day 2: Back & Biceps",
      exercises: [
        { name: "Deadlifts", sets: "4x6-8", completed: false },
        { name: "Pull-Ups", sets: "4x10", completed: false },
        { name: "Bent-over Rows", sets: "4x8-10", completed: false },
        { name: "Lat Pulldown", sets: "3x12", completed: false },
        { name: "Barbell Bicep Curls", sets: "4x10", completed: false },
        { name: "Hammer Curls", sets: "3x12", completed: false },
      ],
    },
    {
      name: "Day 3: Legs & Abs",
      exercises: [
        { name: "Squats", sets: "4x8-10", completed: false },
        { name: "Romanian Deadlifts", sets: "3x10", completed: false },
        { name: "Leg Press", sets: "4x12", completed: false },
        { name: "Leg Curls", sets: "3x12", completed: false },
        { name: "Hanging Leg Raises", sets: "4x12", completed: false },
        { name: "Cable Crunches", sets: "3x15", completed: false },
      ],
    },
    {
      name: "Day 4: Shoulders & Traps",
      exercises: [
        { name: "Overhead Press", sets: "4x8-10", completed: false },
        { name: "Lateral Raises", sets: "4x12", completed: false },
        { name: "Rear Delt Flys", sets: "3x12", completed: false },
        { name: "Shrugs", sets: "4x15", completed: false },
      ],
    },
    {
      name: "Day 5: Arms & Abs",
      exercises: [
        { name: "Barbell Biceps Curl", sets: "4x10", completed: false },
        { name: "Close-Grip Bench Press", sets: "4x10", completed: false },
        { name: "Concentration Curls", sets: "3x12", completed: false },
        { name: "Rope Pushdowns", sets: "3x12", completed: false },
        { name: "Hanging Leg Raises", sets: "4x12", completed: false },
        { name: "Planks", sets: "3x1 min", completed: false },
      ],
    },
    {
      name: "Day 6: Cardio & Core",
      exercises: [
        { name: "HIIT", sets: "15-20 min", completed: false },
        { name: "Cable Twists", sets: "3x12", completed: false },
        { name: "Russian Twists", sets: "3x15", completed: false },
        { name: "Decline Sit-Ups", sets: "4x12", completed: false },
      ],
    },
    {
      name: "Day 7: Rest",
      exercises: [{ name: "Active Recovery (Optional)", sets: "Light walking/stretching", completed: false }],
    },
  ])

  // Load saved workout data from localStorage on component mount
  useEffect(() => {
    const savedWorkout = safeGetItem<WorkoutDay[]>("workoutPlan", []);
    if (savedWorkout.length > 0) {
      setWorkoutPlan(savedWorkout);
    }
  }, [])

  const toggleExercise = (dayIndex: number, exerciseIndex: number) => {
    const updatedWorkoutPlan = [...workoutPlan]
    updatedWorkoutPlan[dayIndex].exercises[exerciseIndex].completed =
      !updatedWorkoutPlan[dayIndex].exercises[exerciseIndex].completed
    setWorkoutPlan(updatedWorkoutPlan)
  }

  const saveProgress = () => {
    try {
      const saveSuccess = safeSetItem("workoutPlan", workoutPlan);
      
      if (saveSuccess) {
        toast({
          title: "Progress saved",
          description: "Your workout progress has been saved successfully.",
        })
      } else {
        throw new Error("Failed to save data to localStorage");
      }
    } catch (error) {
      console.error("Error saving workout data:", error)
      toast({
        title: "Error saving progress",
        description: "There was a problem saving your data. Please try again.",
        variant: "destructive"
      })
    }
  }

  const resetDay = (dayIndex: number) => {
    const updatedWorkoutPlan = [...workoutPlan]
    updatedWorkoutPlan[dayIndex].exercises.forEach((exercise) => {
      exercise.completed = false
    })
    setWorkoutPlan(updatedWorkoutPlan)
  }

  // Calculate completion percentage for each day
  const getDayCompletionPercentage = (dayIndex: number) => {
    const day = workoutPlan[dayIndex]
    if (day.exercises.length === 0) return 0
    
    const completedExercises = day.exercises.filter(ex => ex.completed).length
    return Math.round((completedExercises / day.exercises.length) * 100)
  }

  return (
    <MobileLayout>
      <div className="container max-w-md mx-auto px-3 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Workout Plan</h1>
          <Button onClick={saveProgress} variant="ghost" size="icon" className="h-8 w-8">
            <Save className="h-4 w-4" />
          </Button>
        </div>

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

        <Tabs defaultValue="Day 1: Chest & Triceps" className="space-y-4">
          <TabsList className="grid grid-cols-7 h-auto p-1">
            {workoutPlan.map((day, index) => (
              <TabsTrigger 
                key={index} 
                value={day.name} 
                className="relative py-2 h-auto text-xs"
              >
                <div className="flex flex-col items-center">
                  <span>D{index + 1}</span>
                  {getDayCompletionPercentage(index) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                      {getDayCompletionPercentage(index)}%
                    </span>
                  )}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {workoutPlan.map((day, dayIndex) => (
            <TabsContent key={dayIndex} value={day.name} className="space-y-2 mt-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-medium text-sm">{day.name}</h2>
                <Button variant="outline" size="sm" onClick={() => resetDay(dayIndex)} className="h-7 text-xs">
                  Reset
                </Button>
              </div>
              
              <Card className="shadow-sm">
                <CardContent className="p-3">
                  <div className="space-y-3">
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <div 
                        key={exerciseIndex} 
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`${dayIndex}-${exerciseIndex}`}
                          checked={exercise.completed}
                          onCheckedChange={() => toggleExercise(dayIndex, exerciseIndex)}
                          className="h-5 w-5"
                        />
                        <div className="flex-grow">
                          <label
                            htmlFor={`${dayIndex}-${exerciseIndex}`}
                            className={`flex-grow cursor-pointer text-sm ${exercise.completed ? "line-through text-muted-foreground" : ""}`}
                          >
                            {exercise.name}
                          </label>
                          <p className="text-xs text-muted-foreground">{exercise.sets}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MobileLayout>
  )
}

