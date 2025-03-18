"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { checkSupabaseConnection } from "@/lib/database"
import { supabase } from "@/lib/supabase"

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>("")
  const [details, setDetails] = useState<string>("")
  const [envVars, setEnvVars] = useState<{name: string, value: string, masked: boolean}[]>([])
  
  // Check connection on mount
  useEffect(() => {
    checkConnection()
    
    // Check environment variables
    const vars = [
      { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL || '', masked: false },
      { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', masked: true }
    ]
    
    setEnvVars(vars.map(v => ({
      ...v,
      value: v.masked && v.value ? `${v.value.substring(0, 8)}...${v.value.substring(v.value.length - 4)}` : v.value
    })))
  }, [])
  
  const checkConnection = async () => {
    setStatus('loading')
    setMessage("Checking Supabase connection...")
    setDetails("")
    
    try {
      const result = await checkSupabaseConnection()
      
      if (result.connected) {
        setStatus('success')
        setMessage("Successfully connected to Supabase")
      } else {
        setStatus('error')
        setMessage(result.error?.message || "Failed to connect to Supabase")
        setDetails(result.details || "")
      }
    } catch (error) {
      setStatus('error')
      setMessage(`Error checking connection: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  const testTableExists = async () => {
    setStatus('loading')
    setMessage("Checking if macro_history table exists...")
    
    try {
      const { data, error } = await supabase
        .from('macro_history')
        .select('count')
        .limit(1)
      
      if (error) {
        setStatus('error')
        setMessage(`Error accessing macro_history table: ${error.message}`)
        setDetails(JSON.stringify(error, null, 2))
      } else {
        setStatus('success')
        setMessage("Successfully accessed macro_history table")
        setDetails(`Response: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (error) {
      setStatus('error')
      setMessage(`Exception accessing table: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Supabase Connection Test
          {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
          {status === 'loading' && <RefreshCw className="h-5 w-5 animate-spin" />}
        </CardTitle>
        <CardDescription>
          Test your Supabase connection and configuration
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Environment Variables */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Environment Variables</h3>
          <div className="space-y-1">
            {envVars.map((v, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="font-mono">{v.name}</span>
                <Badge variant={v.value ? "outline" : "destructive"}>
                  {v.value ? v.value : "Missing"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
        
        {/* Status Message */}
        {status !== 'idle' && (
          <Alert variant={status === 'error' ? "destructive" : status === 'success' ? "default" : undefined}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{status === 'error' ? "Connection Error" : "Connection Status"}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        {/* Error Details */}
        {details && (
          <div className="mt-2">
            <h3 className="text-sm font-medium mb-1">Details</h3>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">{details}</pre>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={checkConnection}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Test Connection"
          )}
        </Button>
        
        <Button 
          variant="secondary" 
          onClick={testTableExists}
          disabled={status === 'loading'}
        >
          Test Table Access
        </Button>
      </CardFooter>
    </Card>
  )
} 