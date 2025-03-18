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
import { DietPlan } from "@/lib/plan-templates"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface PlanImportProps {
  onImport: (dietPlans?: DietPlan[]) => void
}

export function PlanImport({ onImport }: PlanImportProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("file")
  const [jsonInput, setJsonInput] = useState("")
  const [importStatus, setImportStatus] = useState<{
    status: "idle" | "success" | "error"
    message: string
    data?: { dietPlans?: DietPlan[] }
  }>({
    status: "idle",
    message: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dietFileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    processFile(file)
  }

  const handleDietFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    processFile(file, "diet")
  }

  const processFile = (file: File, specificType?: "diet") => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        
        // If a specific type is provided, wrap the data in the appropriate structure
        let processedData = data
        if (specificType === "diet" && Array.isArray(data)) {
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
      const dietPlans = validationResult.dietPlans && validationResult.dietPlans.length > 0 ? 
        [validationResult.dietPlans[0]] : undefined;

      // Check if we have any plans after filtering
      if (!dietPlans || dietPlans.length === 0) {
        setImportStatus({
          status: "error",
          message: "No diet plan found in the imported data."
        })
        return
      }

      // Create success message
      let successMessage = "Successfully parsed import data. ";
      
      if (dietPlans && dietPlans.length > 0) {
        const originalCount = validationResult.dietPlans?.length || 0;
        successMessage += `Found ${originalCount} diet plan${originalCount !== 1 ? 's' : ''}, using only the first one.`;
      }

      setImportStatus({
        status: "success",
        message: successMessage,
        data: {
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
      onImport(importStatus.data.dietPlans)

      // Show success message
      let successMessage = "";
      
      if (importStatus.data.dietPlans && importStatus.data.dietPlans.length > 0) {
        successMessage += "Diet plan imported and set as active. Your previous plan and all associated data have been replaced.";
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
          Import Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Diet Plan</DialogTitle>
          <DialogDescription>
            Import a diet plan from a JSON file or paste JSON data directly.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Upload File</TabsTrigger>
            <TabsTrigger value="paste">Paste JSON</TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload JSON File</Label>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file-upload"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full justify-center gap-2"
                >
                  <FileUp className="h-4 w-4" />
                  Select File
                </Button>
                
                <div className="text-sm text-muted-foreground mt-2">
                  <p>The file should contain a valid diet plan in JSON format.</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="paste" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="json-input">Paste JSON Data</Label>
              <Textarea
                id="json-input"
                placeholder='{"dietPlans": [{"id": "fitness-diet", "name": "Fitness Meal Plan", ...}]}'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <Button 
                variant="outline" 
                onClick={handleJsonInputImport}
                className="w-full justify-center gap-2"
              >
                <Clipboard className="h-4 w-4" />
                Parse JSON
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {importStatus.status !== "idle" && (
          <Alert variant={importStatus.status === "success" ? "default" : "destructive"}>
            <AlertTitle>{importStatus.status === "success" ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{importStatus.message}</AlertDescription>
          </Alert>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={importStatus.status !== "success"}
          >
            Import Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 