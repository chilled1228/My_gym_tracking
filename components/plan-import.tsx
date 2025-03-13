"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, FileUp, Clipboard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { validateImportedPlans } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { WorkoutPlan, DietPlan } from "@/lib/plan-templates"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface PlanImportProps {
  onImport: (workoutPlans?: WorkoutPlan[], dietPlans?: DietPlan[]) => void
}

export function PlanImport({ onImport }: PlanImportProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("file")
  const [importType, setImportType] = useState<"both" | "workout" | "diet">("both")
  const [jsonInput, setJsonInput] = useState("")
  const [importStatus, setImportStatus] = useState<{
    status: "idle" | "success" | "error"
    message: string
    data?: { workoutPlans?: WorkoutPlan[], dietPlans?: DietPlan[] }
  }>({
    status: "idle",
    message: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const workoutFileInputRef = useRef<HTMLInputElement>(null)
  const dietFileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    processFile(file)
  }

  const handleWorkoutFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    processFile(file, "workout")
  }

  const handleDietFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    processFile(file, "diet")
  }

  const processFile = (file: File, specificType?: "workout" | "diet") => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        
        // If a specific type is provided, wrap the data in the appropriate structure
        let processedData = data
        if (specificType === "workout" && Array.isArray(data)) {
          processedData = { workoutPlans: data }
        } else if (specificType === "diet" && Array.isArray(data)) {
          processedData = { dietPlans: data }
        }
        
        validateAndSetImportData(processedData)
      } catch (error) {
        setImportStatus({
          status: "error",
          message: `Error parsing JSON: ${error instanceof Error ? error.message : String(error)}`
        })
      }
    }

    reader.onerror = () => {
      setImportStatus({
        status: "error",
        message: "Error reading file"
      })
    }

    reader.readAsText(file)
  }

  const handleJsonInputImport = () => {
    if (!jsonInput.trim()) {
      setImportStatus({
        status: "error",
        message: "Please enter JSON data"
      })
      return
    }

    try {
      const data = JSON.parse(jsonInput)
      validateAndSetImportData(data)
    } catch (error) {
      setImportStatus({
        status: "error",
        message: `Error parsing JSON: ${error instanceof Error ? error.message : String(error)}`
      })
    }
  }

  const validateAndSetImportData = (data: any) => {
    const validationResult = validateImportedPlans(data)

    if (validationResult.isValid) {
      // Filter based on import type and take only the first plan if multiple are present
      const workoutPlans = importType === "diet" ? undefined : 
        (validationResult.workoutPlans && validationResult.workoutPlans.length > 0 ? 
          [validationResult.workoutPlans[0]] : undefined);
      
      const dietPlans = importType === "workout" ? undefined : 
        (validationResult.dietPlans && validationResult.dietPlans.length > 0 ? 
          [validationResult.dietPlans[0]] : undefined);

      // Check if we have any plans after filtering
      if ((!workoutPlans || workoutPlans.length === 0) && (!dietPlans || dietPlans.length === 0)) {
        setImportStatus({
          status: "error",
          message: `No ${importType === "both" ? "workout or diet" : importType} plans found in the imported data.`
        })
        return
      }

      // Create success message
      let successMessage = "Successfully parsed import data. ";
      if (workoutPlans && workoutPlans.length > 0) {
        const originalCount = validationResult.workoutPlans?.length || 0;
        successMessage += `Found ${originalCount} workout plan${originalCount !== 1 ? 's' : ''}, using only the first one. `;
      }
      
      if (dietPlans && dietPlans.length > 0) {
        const originalCount = validationResult.dietPlans?.length || 0;
        successMessage += `Found ${originalCount} diet plan${originalCount !== 1 ? 's' : ''}, using only the first one.`;
      }

      setImportStatus({
        status: "success",
        message: successMessage,
        data: {
          workoutPlans,
          dietPlans
        }
      })
    } else {
      setImportStatus({
        status: "error",
        message: validationResult.message
      })
    }
  }

  const handleImport = () => {
    if (importStatus.status !== "success" || !importStatus.data) {
      toast({
        title: "Error",
        description: "Please upload or paste valid plan data first.",
        variant: "destructive"
      })
      return
    }

    try {
      // Import the plans
      onImport(
        importStatus.data.workoutPlans,
        importStatus.data.dietPlans
      )

      // Show success message
      let successMessage = "";
      
      if (importType === "both" || importType === "workout") {
        if (importStatus.data.workoutPlans && importStatus.data.workoutPlans.length > 0) {
          successMessage += "Workout plan imported and set as active. Your previous plan and all associated data have been replaced. ";
        }
      }
      
      if (importType === "both" || importType === "diet") {
        if (importStatus.data.dietPlans && importStatus.data.dietPlans.length > 0) {
          successMessage += "Diet plan imported and set as active. Your previous plan and all associated data have been replaced.";
        }
      }
      
      toast({
        title: "Plan Imported",
        description: successMessage || "Import successful.",
      })

      // Reset the form
      setIsOpen(false)
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      })
    }
  }

  const resetImportState = () => {
    setIsOpen(false)
    setImportStatus({
      status: "idle",
      message: "",
    })
    setJsonInput("")
    
    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (workoutFileInputRef.current) workoutFileInputRef.current.value = ""
    if (dietFileInputRef.current) dietFileInputRef.current.value = ""
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetImportState()
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileDown className="h-4 w-4" />
          Replace Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Replace Current Plan</DialogTitle>
          <DialogDescription>
            Import a workout or diet plan from a file or paste JSON data. 
            The imported plan will replace your current plan and clear all associated data.
            Only the first plan will be used if multiple plans are present in the imported data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2 sm:py-4">
          <RadioGroup 
            value={importType} 
            onValueChange={(value) => setImportType(value as "both" | "workout" | "diet")}
            className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="both" />
              <Label htmlFor="both">Both</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="workout" id="workout" />
              <Label htmlFor="workout">Workout Only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="diet" id="diet" />
              <Label htmlFor="diet">Diet Only</Label>
            </div>
          </RadioGroup>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">
                <FileUp className="h-4 w-4 mr-2" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="paste">
                <Clipboard className="h-4 w-4 mr-2" />
                Paste JSON
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="space-y-4 mt-4">
              {importType === "both" && (
                <div className="space-y-2">
                  <Label htmlFor="plan-file" className="text-sm font-medium">
                    Upload Combined JSON File
                  </Label>
                  <input
                    ref={fileInputRef}
                    id="plan-file"
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="w-full cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              )}
              
              {(importType === "both" || importType === "workout") && (
                <div className="space-y-2">
                  <Label htmlFor="workout-file" className="text-sm font-medium">
                    Upload Workout Plan
                  </Label>
                  <input
                    ref={workoutFileInputRef}
                    id="workout-file"
                    type="file"
                    accept=".json"
                    onChange={handleWorkoutFileChange}
                    className="w-full cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              )}
              
              {(importType === "both" || importType === "diet") && (
                <div className="space-y-2">
                  <Label htmlFor="diet-file" className="text-sm font-medium">
                    Upload Diet Plan
                  </Label>
                  <input
                    ref={dietFileInputRef}
                    id="diet-file"
                    type="file"
                    accept=".json"
                    onChange={handleDietFileChange}
                    className="w-full cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="paste" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="json-input" className="text-sm font-medium">
                  Paste JSON Data
                </Label>
                <Textarea
                  id="json-input"
                  placeholder="Paste your JSON data here..."
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="min-h-[120px] sm:min-h-[150px] font-mono text-xs"
                />
                <Button 
                  onClick={handleJsonInputImport} 
                  size="sm" 
                  className="w-full"
                >
                  Parse JSON
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          {importStatus.status === "success" && (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{importStatus.message}</AlertDescription>
            </Alert>
          )}
          
          {importStatus.status === "error" && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{importStatus.message}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Example Format</h4>
            <pre className="p-2 bg-muted rounded-md text-[10px] sm:text-xs overflow-auto max-h-24 sm:max-h-32">
{importType === "both" ? 
`{
  "workoutPlans": [
    {
      "id": "custom-plan",
      "name": "My Custom Plan",
      "description": "A custom workout plan",
      "days": [...]
    }
  ],
  "dietPlans": [
    {
      "id": "custom-diet",
      "name": "My Custom Diet",
      "description": "A custom diet plan",
      "targetCalories": 2000,
      "targetProtein": 150,
      "targetCarbs": 200,
      "targetFats": 70,
      "meals": [
        {
          "name": "Breakfast",
          "time": "8:00 AM",
          "items": [
            {
              "name": "Oatmeal",
              "completed": false,
              "calories": 150,
              "protein": 5,
              "carbs": 27,
              "fats": 3
            }
          ]
        }
      ]
    }
  ]
}` : importType === "workout" ? 
`{
  "id": "custom-plan",
  "name": "My Custom Plan",
  "description": "A custom workout plan",
  "days": [...]
}` : 
`{
  "id": "custom-diet",
  "name": "My Custom Diet",
  "description": "A custom diet plan",
  "targetCalories": 2000,
  "targetProtein": 150,
  "targetCarbs": 200,
  "targetFats": 70,
  "meals": [
    {
      "name": "Breakfast",
      "time": "8:00 AM",
      "items": [
        {
          "name": "Oatmeal",
          "completed": false,
          "calories": 150,
          "protein": 5,
          "carbs": 27,
          "fats": 3
        }
      ]
    }
  ]
}`}
            </pre>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={importStatus.status !== "success"}
          >
            Replace Current Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 