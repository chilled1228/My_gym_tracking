"use client"

import { useState } from "react"
import { DietPlan } from "@/lib/plan-templates"
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
import { Utensils } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PlanSelectorProps {
  currentPlanId: string
  availablePlans: DietPlan[]
  onPlanChange: (planId: string) => void
}

export function PlanSelector({
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
      title: "Diet Plan Updated",
      description: "Your diet plan has been updated successfully.",
    })
  }
  
  const currentPlan = availablePlans.find(plan => plan.id === currentPlanId) || availablePlans[0]
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2 p-2 rounded-md border bg-card w-full sm:w-auto cursor-pointer hover:bg-accent">
          <Utensils className="h-4 w-4 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{currentPlan?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentPlan?.description}</p>
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Diet Plan</DialogTitle>
          <DialogDescription>
            Choose a diet plan from the available options.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a diet plan" />
            </SelectTrigger>
            <SelectContent>
              {availablePlans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedPlanId && (
            <div className="mt-4 p-3 border rounded-md">
              <h4 className="font-medium">{availablePlans.find(p => p.id === selectedPlanId)?.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {availablePlans.find(p => p.id === selectedPlanId)?.description}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 