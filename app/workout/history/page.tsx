"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Calendar, BarChart } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { safeGetItem } from "@/lib/utils"
import { format, subDays, isAfter } from "date-fns"
import Link from "next/link"

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

interface WorkoutHistory {
  date: string
  exerciseName: string
  reps: number
}

export default function WorkoutHistoryPage() {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([])
  const [exerciseNames, setExerciseNames] = useState<string[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>("")
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "all">("30days")

  useEffect(() => {
    // Load workout history
    const history = safeGetItem<WorkoutHistory[]>("workoutHistory", [])
    setWorkoutHistory(history)

    // Extract unique exercise names
    const uniqueExercises = [...new Set(history.map(entry => entry.exerciseName))]
    setExerciseNames(uniqueExercises)
    
    if (uniqueExercises.length > 0) {
      setSelectedExercise(uniqueExercises[0])
    }
  }, [])

  // Filter history by time range
  const getFilteredHistory = () => {
    if (!selectedExercise) return []

    const filteredByExercise = workoutHistory.filter(
      entry => entry.exerciseName === selectedExercise
    )

    if (timeRange === "all") return filteredByExercise

    const cutoffDate = new Date()
    if (timeRange === "7days") {
      cutoffDate.setDate(cutoffDate.getDate() - 7)
    } else if (timeRange === "30days") {
      cutoffDate.setDate(cutoffDate.getDate() - 30)
    }

    return filteredByExercise.filter(entry => 
      isAfter(new Date(entry.date), cutoffDate)
    )
  }

  // Get history data for the selected exercise
  const exerciseHistory = getFilteredHistory()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Calculate statistics
  const calculateStats = () => {
    if (exerciseHistory.length === 0) {
      return {
        totalReps: 0,
        averageReps: 0,
        maxReps: 0,
        progress: 0
      }
    }

    const totalReps = exerciseHistory.reduce((sum, entry) => sum + entry.reps, 0)
    const averageReps = Math.round(totalReps / exerciseHistory.length)
    const maxReps = Math.max(...exerciseHistory.map(entry => entry.reps))
    
    // Calculate progress (difference between first and last entry)
    const firstEntry = exerciseHistory[0]
    const lastEntry = exerciseHistory[exerciseHistory.length - 1]
    const progress = lastEntry.reps - firstEntry.reps
    
    return {
      totalReps,
      averageReps,
      maxReps,
      progress
    }
  }

  const stats = calculateStats()

  return (
    <MobileLayout>
      <div className="container max-w-md mx-auto px-3 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link href="/workout">
              <Button variant="ghost" size="icon" className="h-8 w-8 mr-2">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Workout History</h1>
          </div>
        </div>

        <Card className="mb-4 shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center">
                <BarChart className="h-4 w-4 mr-2" />
                Exercise Progress
              </div>
              <select 
                className="text-xs bg-background border rounded px-2 py-1"
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
              >
                {exerciseNames.map((exercise, index) => (
                  <option key={index} value={exercise}>{exercise}</option>
                ))}
              </select>
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="flex justify-between mb-4">
              <Button 
                variant={timeRange === "7days" ? "default" : "outline"} 
                size="sm" 
                className="text-xs h-7"
                onClick={() => setTimeRange("7days")}
              >
                7 Days
              </Button>
              <Button 
                variant={timeRange === "30days" ? "default" : "outline"} 
                size="sm" 
                className="text-xs h-7"
                onClick={() => setTimeRange("30days")}
              >
                30 Days
              </Button>
              <Button 
                variant={timeRange === "all" ? "default" : "outline"} 
                size="sm" 
                className="text-xs h-7"
                onClick={() => setTimeRange("all")}
              >
                All Time
              </Button>
            </div>

            {selectedExercise && exerciseHistory.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Total Reps</p>
                    <p className="text-xl font-bold">{stats.totalReps}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Max Reps</p>
                    <p className="text-xl font-bold">{stats.maxReps}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Average</p>
                    <p className="text-xl font-bold">{stats.averageReps}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className={`text-xl font-bold ${stats.progress > 0 ? 'text-green-500' : stats.progress < 0 ? 'text-red-500' : ''}`}>
                      {stats.progress > 0 ? '+' : ''}{stats.progress}
                    </p>
                  </div>
                </div>

                <div className="h-60 flex items-end justify-between mt-6">
                  {exerciseHistory.map((entry, index) => {
                    const maxReps = stats.maxReps
                    const height = maxReps > 0 ? (entry.reps / maxReps) * 100 : 0
                    
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="w-8 bg-primary rounded-t"
                          style={{ height: `${height}%` }}
                        ></div>
                        <p className="text-xs mt-1">{format(new Date(entry.date), 'dd/MM')}</p>
                        <p className="text-xs font-medium">{entry.reps}</p>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                {!selectedExercise ? (
                  <p>No exercises tracked yet</p>
                ) : (
                  <p>No history data available for this exercise</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedExercise && exerciseHistory.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                History Log
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="space-y-2">
                {exerciseHistory.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{format(new Date(entry.date), 'EEEE, MMM d, yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{entry.reps} reps</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  )
} 