"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function ClearProgressButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [details, setDetails] = useState<Record<string, any> | null>(null)

  const handleClearProgress = async () => {
    setIsLoading(true)
    setDetails(null)
    
    try {
      const response = await fetch('/api/clear-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        toast.success('Progress data cleared successfully')
        if (result.details) {
          setDetails(result.details)
        }
      } else {
        toast.error(`Failed to clear progress: ${result.message}`)
        if (result.details) {
          setDetails(result.details)
        }
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            Clear All Progress Data
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all workout history, diet history, and macro tracking data from Supabase.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleClearProgress()
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Yes, Clear All Data'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {details && (
        <div className="mt-4 p-4 border rounded-md bg-muted">
          <h3 className="text-sm font-medium mb-2">Clear Progress Details:</h3>
          <ul className="space-y-1 text-sm">
            {Object.entries(details).map(([table, status]: [string, any]) => (
              <li key={table} className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${status.success ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">{table}:</span>
                <span className="ml-1">{status.success ? 'Cleared' : `Failed - ${status.error}`}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 