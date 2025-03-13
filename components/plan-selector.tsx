"use client"

import { useState } from "react"
import { WorkoutPlan, DietPlan } from "@/lib/plan-templates"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dumbbell, Utensils } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PlanSelectorProps {
  type: "workout" | "diet"
  currentPlanId: string
  availablePlans: WorkoutPlan[] | DietPlan[]
  onPlanChange: (planId: string) => void
}

export function PlanSelector({
  type,
  currentPlanId,
  availablePlans,
  onPlanChange,
}: PlanSelectorProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId)
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelectedPlanId(currentPlanId)
    }
    setIsOpen(open)
  }
  
  const handleSave = () => {
    onPlanChange(selectedPlanId)
    setIsOpen(false)
    
    toast({
      title: `${type === "workout" ? "Workout" : "Diet"} Plan Updated`,
      description: `Your ${type} plan has been updated successfully.`,
    })
  }
  
  const currentPlan = availablePlans.find(plan => plan.id === currentPlanId)
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
          {type === "workout" ? <Dumbbell className="h-4 w-4" /> : <Utensils className="h-4 w-4" />}
          Change Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-[95vw] sm:w-auto">
        <DialogHeader>
          <DialogTitle>Change {type === "workout" ? "Workout" : "Diet"} Plan</DialogTitle>
          <DialogDescription>
            Select a different {type} plan from the options below.
            Your progress for the current plan will be saved.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Current Plan</h4>
            <p className="text-sm text-muted-foreground">{currentPlan?.name}</p>
            <p className="text-xs text-muted-foreground">{currentPlan?.description}</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Select New Plan</h4>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {availablePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedPlanId !== currentPlanId && (
              <div className="mt-2 rounded-md bg-muted p-3">
                <h5 className="font-medium text-sm">
                  {availablePlans.find(p => p.id === selectedPlanId)?.name}
                </h5>
                <p className="text-xs text-muted-foreground">
                  {availablePlans.find(p => p.id === selectedPlanId)?.description}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={selectedPlanId === currentPlanId}
            className="w-full sm:w-auto"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 