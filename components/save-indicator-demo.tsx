"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DataSaveIndicator, useSaveStatus } from "@/components/data-save-indicator"
import { useData } from "@/contexts/data-context"
import { v4 as uuidv4 } from "uuid"
import type { SaveStatusCallback } from "@/lib/database"

export function SaveIndicatorDemo() {
  const { saveStatus, statusMessage, setSaving, setSaved, setError } = useSaveStatus()
  const { saveMacros } = useData()
  const [isChecked, setIsChecked] = useState(false)
  
  const handleCheckboxChange = async (checked: boolean) => {
    setIsChecked(checked)
    
    // Simulate saving data to Supabase
    setSaving()
    
    try {
      // Create a sample macro entry for today
      const today = new Date().toISOString().split('T')[0]
      const macros = {
        id: uuidv4(),
        date: today,
        calories: checked ? 2000 : 0,
        protein: checked ? 150 : 0,
        carbs: checked ? 200 : 0,
        fats: checked ? 70 : 0
      }
      
      // Save to Supabase with status callbacks
      const statusCallbacks: SaveStatusCallback = {
        onSuccess: () => {
          setSaved("Data saved to Supabase")
        },
        onError: (error: any) => {
          setError(`Failed to save: ${error.message || 'Unknown error'}`)
        }
      }
      
      const success = await saveMacros(macros, statusCallbacks)
      
      if (!success) {
        setError("Failed to save data")
      }
    } catch (error) {
      setError(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Save Indicator Demo</CardTitle>
        <CardDescription>
          Check the box to save data to Supabase
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="demo-checkbox" 
            checked={isChecked}
            onCheckedChange={handleCheckboxChange}
          />
          <Label htmlFor="demo-checkbox">
            Track macros for today
          </Label>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <DataSaveIndicator status={saveStatus} message={statusMessage} />
        
        <Button 
          variant="outline" 
          onClick={() => handleCheckboxChange(!isChecked)}
        >
          Toggle
        </Button>
      </CardFooter>
    </Card>
  )
} 