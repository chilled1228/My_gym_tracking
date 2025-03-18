"use client"

import { createContext, useContext, ReactNode, useState, useEffect, useRef, useCallback } from "react"
import * as db from "@/lib/database"
import type { 
  WorkoutPlan, 
  WorkoutHistory, 
  DietPlan, 
  DietDay, 
  DailyMacros 
} from "@/lib/supabase"
import type { SaveStatusCallback } from "@/lib/database"

// Global state to track if we've already checked the database status
// This prevents multiple checks across page navigations
let hasCheckedDatabaseStatus = false

// Database status type
interface DatabaseStatus {
  checked: boolean
  isReady: boolean
  message: string
  missingTables?: string[]
  sqlScript?: string
  lastChecked?: number
  dismissed?: boolean
}

// Context interface
interface DataContextType {
  // Workout Plans
  getWorkoutPlans: () => Promise<WorkoutPlan[]>
  getWorkoutPlan: (id: string) => Promise<WorkoutPlan | null>
  saveWorkoutPlan: (plan: WorkoutPlan, statusCallbacks?: SaveStatusCallback) => Promise<boolean>
  deleteWorkoutPlan: (id: string, statusCallbacks?: SaveStatusCallback) => Promise<boolean>
  
  // Workout History
  getWorkoutHistory: (limit?: number) => Promise<WorkoutHistory[]>
  getWorkoutForDate: (date: string) => Promise<WorkoutHistory | null>
  saveWorkoutHistory: (workout: WorkoutHistory, statusCallbacks?: SaveStatusCallback) => Promise<boolean>
  
  // Diet Plans
  getDietPlans: () => Promise<DietPlan[]>
  getDietPlan: (id: string) => Promise<DietPlan | null>
  getCurrentDietPlan: () => Promise<DietPlan | null>
  setCurrentDietPlan: (planId: string, statusCallbacks?: SaveStatusCallback) => Promise<boolean>
  saveDietPlan: (plan: DietPlan, statusCallbacks?: SaveStatusCallback) => Promise<boolean>
  deleteDietPlan: (id: string, statusCallbacks?: SaveStatusCallback) => Promise<boolean>
  
  // Diet History
  getDietHistory: (limit?: number) => Promise<DietDay[]>
  getDietForDate: (date: string) => Promise<DietDay | null>
  saveDietDay: (dietDay: DietDay, statusCallbacks?: SaveStatusCallback) => Promise<boolean>
  
  // Macro History
  getMacroHistory: (limit?: number) => Promise<DailyMacros[]>
  getMacrosForDate: (date: string) => Promise<DailyMacros | null>
  saveMacros: (macros: DailyMacros, statusCallbacks?: SaveStatusCallback) => Promise<boolean>
  
  // Status
  isLoading: boolean
  
  // Database setup
  checkDatabaseSetup: (force?: boolean) => Promise<{
    success: boolean;
    message: string;
    missingTables?: string[];
    sqlScript?: string;
  }>
  updateDatabaseStatus: (status: DatabaseStatus) => void
  databaseStatus: DatabaseStatus
}

// Default database status
const defaultDatabaseStatus: DatabaseStatus = {
  checked: false,
  isReady: false,
  message: "Database status not checked",
  dismissed: false,
}

// Create context with default values
const DataContext = createContext<DataContextType>({
  // Default implementations that will be overridden
  getWorkoutPlans: async () => [],
  getWorkoutPlan: async () => null,
  saveWorkoutPlan: async () => false,
  deleteWorkoutPlan: async () => false,
  
  getWorkoutHistory: async () => [],
  getWorkoutForDate: async () => null,
  saveWorkoutHistory: async () => false,
  
  getDietPlans: async () => [],
  getDietPlan: async () => null,
  getCurrentDietPlan: async () => null,
  setCurrentDietPlan: async () => false,
  saveDietPlan: async () => false,
  deleteDietPlan: async () => false,
  
  getDietHistory: async () => [],
  getDietForDate: async () => null,
  saveDietDay: async () => false,
  
  getMacroHistory: async () => [],
  getMacrosForDate: async () => null,
  saveMacros: async () => false,
  
  isLoading: true,
  
  checkDatabaseSetup: async () => ({ success: false, message: "Not implemented" }),
  updateDatabaseStatus: () => {},
  databaseStatus: defaultDatabaseStatus
})

// Provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus>(defaultDatabaseStatus)
  const initialCheckDone = useRef(false)
  const checkInProgressRef = useRef(false)
  
  // Check database status on mount
  useEffect(() => {
    // Skip if we've already done the initial check
    if (initialCheckDone.current) return
    
    // If we've already checked globally, don't check again
    if (hasCheckedDatabaseStatus) {
      initialCheckDone.current = true
      return
    }
    
    // Check database status
    checkDatabaseSetup(false).then(() => {
      // Mark that we've checked the database status globally
      hasCheckedDatabaseStatus = true
      initialCheckDone.current = true
    })
  }, [])
  
  // Update database status directly
  const updateDatabaseStatus = useCallback(async (status: DatabaseStatus) => {
    setDatabaseStatus(status)
    
    // Update global check flag if status is checked
    if (status.checked) {
      hasCheckedDatabaseStatus = true
    }
    
    // Store database status in Supabase
    try {
      await fetch('/api/database-status-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ status })
      })
    } catch (error) {
      console.error('Error storing database status:', error)
    }
  }, [])
  
  // Check database setup
  const checkDatabaseSetup = useCallback(async (force = false): Promise<{
    success: boolean;
    message: string;
    missingTables?: string[];
    sqlScript?: string;
  }> => {
    // If a check is already in progress, don't start another one
    if (checkInProgressRef.current) {
      return {
        success: databaseStatus.isReady,
        message: databaseStatus.message
      }
    }
    
    // If we've already checked and not forcing a refresh, return the current status
    if (databaseStatus.checked && !force) {
      return {
        success: databaseStatus.isReady,
        message: databaseStatus.message,
        missingTables: databaseStatus.missingTables,
        sqlScript: databaseStatus.sqlScript
      }
    }
    
    // Set loading state
    setIsLoading(true)
    checkInProgressRef.current = true
    
    try {
      // First, try to get the stored database status
      if (!force) {
        try {
          const storedStatusResponse = await fetch('/api/database-status-store', {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          })
          
          if (storedStatusResponse.ok) {
            const storedStatusResult = await storedStatusResponse.json()
            
            if (storedStatusResult.success && storedStatusResult.status) {
              const storedStatus = storedStatusResult.status
              
              // Check if stored status is recent (less than 1 hour old)
              const isRecent = storedStatus.lastChecked && 
                (Date.now() - storedStatus.lastChecked < 60 * 60 * 1000) // 1 hour
              
              if (isRecent) {
                setDatabaseStatus(storedStatus)
                hasCheckedDatabaseStatus = true
                return {
                  success: storedStatus.isReady,
                  message: storedStatus.message,
                  missingTables: storedStatus.missingTables,
                  sqlScript: storedStatus.sqlScript
                }
              }
            }
          }
        } catch (error) {
          console.error('Error retrieving stored database status:', error)
          // Continue with fresh check if there's an error
        }
      }
      
      // Fetch database status from API
      const response = await fetch('/api/database-status', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Preserve the dismissed state when updating
      const wasDismissed = databaseStatus.dismissed
      
      // Update database status
      const newStatus: DatabaseStatus = {
        checked: true,
        isReady: result.success,
        message: result.message,
        missingTables: result.missingTables,
        sqlScript: result.sqlScript,
        lastChecked: Date.now(),
        dismissed: wasDismissed
      }
      
      setDatabaseStatus(newStatus)
      
      // Store the new status in Supabase
      await updateDatabaseStatus(newStatus)
      
      // Update global check flag
      hasCheckedDatabaseStatus = true
      
      return result
    } catch (error) {
      console.error('Error checking database setup:', error)
      
      // Preserve the dismissed state when updating
      const wasDismissed = databaseStatus.dismissed
      
      // Update with error
      const errorStatus: DatabaseStatus = {
        checked: true,
        isReady: false,
        message: `Error checking database: ${error instanceof Error ? error.message : String(error)}`,
        lastChecked: Date.now(),
        dismissed: wasDismissed
      }
      
      setDatabaseStatus(errorStatus)
      
      // Store the error status in Supabase
      await updateDatabaseStatus(errorStatus)
      
      return {
        success: false,
        message: errorStatus.message
      }
    } finally {
      setIsLoading(false)
      checkInProgressRef.current = false
    }
  }, [databaseStatus, updateDatabaseStatus])
  
  // Always use Supabase implementation
  const contextValue: DataContextType = {
    ...db,
    isLoading,
    checkDatabaseSetup,
    updateDatabaseStatus,
    databaseStatus
  }
  
  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

// Hook for using the data context
export function useData() {
  return useContext(DataContext)
} 