"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react"
import { migrateToSupabase } from "@/lib/migrate-to-supabase"
import { Progress } from "@/components/ui/progress"

export function MigrateDataCard() {
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean
    message: string
    details?: {
      workoutPlans: number
      workoutHistory: number
      dietPlans: number
      dietHistory: number
      macroHistory: number
    }
  } | null>(null)
  const [progress, setProgress] = useState(0)

  const handleMigration = async () => {
    try {
      setIsMigrating(true)
      setProgress(10)
      
      // Simulate progress steps for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)
      
      // Perform the actual migration
      const result = await migrateToSupabase()
      
      // Clear the interval and set final progress
      clearInterval(progressInterval)
      setProgress(100)
      
      // Set the result
      setMigrationResult(result)
    } catch (error) {
      setMigrationResult({
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`
      })
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className="w-full">
      {isMigrating ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Migrating your data... Please don't close this page.
          </p>
          <Progress value={progress} className="h-2" />
        </div>
      ) : migrationResult ? (
        <div className="space-y-4">
          <Alert variant={migrationResult.success ? "default" : "destructive"}>
            <div className="flex items-start gap-3">
              {migrationResult.success ? (
                <CheckCircle2 className="h-5 w-5 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 mt-0.5" />
              )}
              <div>
                <AlertTitle>
                  {migrationResult.success ? "Migration Complete" : "Migration Failed"}
                </AlertTitle>
                <AlertDescription>
                  {migrationResult.message}
                  
                  {migrationResult.success && migrationResult.details && (
                    <div className="mt-2 text-sm">
                      <p>Migrated items:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Workout Plans: {migrationResult.details.workoutPlans}</li>
                        <li>Workout History: {migrationResult.details.workoutHistory}</li>
                        <li>Diet Plans: {migrationResult.details.dietPlans}</li>
                        <li>Diet History: {migrationResult.details.dietHistory}</li>
                        <li>Macro History: {migrationResult.details.macroHistory}</li>
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setMigrationResult(null)}
          >
            Done
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Button 
            className="w-full" 
            onClick={handleMigration} 
            disabled={isMigrating}
          >
            Migrate Local Data to Supabase
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
} 