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
  
  const currentPlan = availablePlans.find(plan => plan.id === currentPlanId) || availablePlans[0]
  
  return (
    <div className="flex items-center gap-2 p-2 rounded-md border bg-card w-full sm:w-auto">
      {type === "workout" ? <Dumbbell className="h-4 w-4 text-primary" /> : <Utensils className="h-4 w-4 text-primary" />}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{currentPlan?.name}</p>
        <p className="text-xs text-muted-foreground truncate">{currentPlan?.description}</p>
      </div>
    </div>
  )
} 