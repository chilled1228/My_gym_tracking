"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { exportPlansToJson, downloadJson } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DietPlan } from "@/lib/plan-templates"

interface PlanExportProps {
  dietPlans: DietPlan[]
}

export function PlanExport({ dietPlans }: PlanExportProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [filename, setFilename] = useState("tracker-diet-plan.json")

  const handleExport = () => {
    try {
      // Generate JSON content
      const jsonContent = exportPlansToJson(
        undefined,
        dietPlans
      )
      
      // Download the file
      downloadJson(filename, jsonContent)
      
      // Show success toast
      toast({
        title: "Diet Plan Exported",
        description: "Your diet plan has been exported successfully.",
      })
      
      // Close the dialog
      setIsOpen(false)
    } catch (error) {
      // Show error toast
      toast({
        title: "Export Failed",
        description: `Failed to export diet plan: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileDown className="h-4 w-4" />
          Export Diet Plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Diet Plan</DialogTitle>
          <DialogDescription>
            Export your diet plan to a JSON file that you can share or backup.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="filename" className="text-sm font-medium">Filename</label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename"
            />
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              The exported file will contain your fitness meal plan.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            Export Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 