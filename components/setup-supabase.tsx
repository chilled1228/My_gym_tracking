"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Database, Copy, RefreshCw, Play } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useData } from "@/contexts/data-context"
import { format, formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface SetupSupabaseCardProps {
  autoSetup?: boolean
}

export function SetupSupabaseCard({ autoSetup = false }: SetupSupabaseCardProps) {
  const { checkDatabaseSetup, updateDatabaseStatus, databaseStatus, isLoading } = useData()
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<string>("status")
  const [isExecuting, setIsExecuting] = useState(false)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const setupAttemptedRef = useRef(false)

  // Handle auto setup only once
  useEffect(() => {
    if (autoSetup && !setupAttemptedRef.current && !databaseStatus.checked) {
      setupAttemptedRef.current = true
      handleSetup()
    }
    
    // When database status changes and there's a SQL script, switch to SQL tab
    if (databaseStatus.checked && databaseStatus.sqlScript) {
      setActiveTab("sql")
    }
    
    // Cleanup on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [autoSetup, databaseStatus])

  // Progress simulation effect - optimized to prevent unnecessary re-renders
  useEffect(() => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    
    if (isLoading) {
      setProgress(0)
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 5
          return newProgress < 90 ? newProgress : prev
        })
      }, 100)
    } else {
      setProgress(100)
    }
    
    // Cleanup on unmount or when isLoading changes
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [isLoading])

  const handleSetup = async () => {
    await checkDatabaseSetup(true) // Force refresh
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("SQL script copied to clipboard")
  }

  // Format the last checked time
  const getLastCheckedText = () => {
    if (!databaseStatus.lastChecked) return null
    
    const lastCheckedDate = new Date(databaseStatus.lastChecked)
    const timeAgo = formatDistanceToNow(lastCheckedDate, { addSuffix: true })
    const formattedDate = format(lastCheckedDate, 'MMM d, yyyy h:mm a')
    
    return `Last checked ${timeAgo} (${formattedDate})`
  }

  // Execute SQL script directly
  const executeScript = async () => {
    if (!databaseStatus.sqlScript || !databaseStatus.missingTables) return
    
    setIsExecuting(true)
    try {
      const response = await fetch('/api/database-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ 
          sqlScript: databaseStatus.sqlScript,
          tableNames: databaseStatus.missingTables 
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success("Database tables created successfully")
        
        // If the API returned updated database status, use it directly
        if (result.databaseStatus) {
          // Update the database status with the latest from the API
          await updateDatabaseStatus({
            checked: true,
            isReady: result.databaseStatus.success,
            message: result.databaseStatus.message,
            missingTables: result.databaseStatus.missingTables,
            sqlScript: result.databaseStatus.sqlScript
          })
        } else {
          // Otherwise, refresh database status
          await checkDatabaseSetup(true)
        }
      } else {
        toast.error(`Failed to create tables: ${result.message}`)
        // Refresh database status to get the latest
        await checkDatabaseSetup(true)
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
      // Refresh database status to get the latest
      await checkDatabaseSetup(true)
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Supabase Database Setup
        </CardTitle>
        <CardDescription>
          Check and setup required database tables in Supabase
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Checking Supabase tables...</p>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {databaseStatus.checked && !isLoading && (
          <>
            {databaseStatus.lastChecked && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-muted-foreground">{getLastCheckedText()}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2"
                  onClick={handleSetup}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Refresh
                </Button>
              </div>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="sql" disabled={!databaseStatus.sqlScript}>SQL Script</TabsTrigger>
              </TabsList>
              
              <TabsContent value="status" className="mt-4">
                <Alert variant={databaseStatus.isReady ? "default" : "destructive"}>
                  <div className="flex items-start gap-2">
                    {databaseStatus.isReady ? (
                      <CheckCircle className="h-5 w-5 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mt-0.5" />
                    )}
                    <div>
                      <AlertTitle>{databaseStatus.isReady ? "Success" : "Action Required"}</AlertTitle>
                      <AlertDescription className="mt-1">
                        {databaseStatus.message}
                        {databaseStatus.missingTables && databaseStatus.missingTables.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium">Missing tables:</p>
                            <ul className="list-disc pl-5 mt-1">
                              {databaseStatus.missingTables.map((table) => (
                                <li key={table}>{table}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              </TabsContent>
              
              <TabsContent value="sql" className="mt-4">
                {databaseStatus.sqlScript && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">SQL Script to Create Missing Tables</p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8"
                          onClick={() => copyToClipboard(databaseStatus.sqlScript || "")}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="h-8"
                          onClick={executeScript}
                          disabled={isExecuting}
                        >
                          <Play className={`h-4 w-4 mr-1 ${isExecuting ? "animate-pulse" : ""}`} />
                          {isExecuting ? "Creating..." : "Create Tables"}
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/50">
                      <pre className="text-xs whitespace-pre-wrap">{databaseStatus.sqlScript}</pre>
                    </ScrollArea>
                    <p className="text-xs text-muted-foreground mt-2">
                      You can run this SQL in the Supabase SQL Editor or click "Create Tables" to execute it automatically.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleSetup} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Checking..." : databaseStatus.checked ? "Check Again" : "Check Tables"}
        </Button>
      </CardFooter>
    </Card>
  )
} 