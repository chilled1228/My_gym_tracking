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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { WorkoutPlan, DietPlan } from "@/lib/plan-templates"

interface PlanExportProps {
  workoutPlans: WorkoutPlan[]
  dietPlans: DietPlan[]
}

export function PlanExport({ workoutPlans, dietPlans }: PlanExportProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [filename, setFilename] = useState("tracker-plans.json")
  const [selectedPlans, setSelectedPlans] = useState({
    workout: true,
    diet: true
  })

  const handleExport = () => {
    try {
      // Filter plans based on selection
      const plansToExport = {
        workoutPlans: selectedPlans.workout ? workoutPlans : undefined,
        dietPlans: selectedPlans.diet ? dietPlans : undefined
      }
      
      // Generate JSON content
      const jsonContent = exportPlansToJson(
        plansToExport.workoutPlans,
        plansToExport.dietPlans
      )
      
      // Download the file
      downloadJson(filename, jsonContent)
      
      // Show success toast
      toast({
        title: "Plans Exported",
        description: "Your plans have been exported successfully.",
      })
      
      // Close the dialog
      setIsOpen(false)
    } catch (error) {
      // Show error toast
      toast({
        title: "Export Failed",
        description: `Failed to export plans: ${error instanceof Error ? error.message : String(error)}`,
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
          Export Plans
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Plans</DialogTitle>
          <DialogDescription>
            Export your workout and diet plans to a JSON file that you can share or backup.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename"
            />
          </div>
          
          <div className="space-y-3">
            <Label>Select Plans to Export</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="workout"
                checked={selectedPlans.workout}
                onCheckedChange={(checked) => 
                  setSelectedPlans({ ...selectedPlans, workout: !!checked })
                }
              />
              <Label htmlFor="workout" className="cursor-pointer">
                Workout Plans ({workoutPlans.length})
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="diet"
                checked={selectedPlans.diet}
                onCheckedChange={(checked) => 
                  setSelectedPlans({ ...selectedPlans, diet: !!checked })
                }
              />
              <Label htmlFor="diet" className="cursor-pointer">
                Diet Plans ({dietPlans.length})
              </Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              The exported file will contain all your selected plans, including any custom or imported plans.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={!selectedPlans.workout && !selectedPlans.diet}
          >
            Export Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 