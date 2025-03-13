"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface TabIndicatorProps {
  tabs: string[]
  activeTab: string
  onChange: (tab: string) => void
  className?: string
  variant?: "default" | "pill" | "underline"
}

export function TabIndicator({ 
  tabs, 
  activeTab, 
  onChange, 
  className,
  variant = "default" 
}: TabIndicatorProps) {
  if (variant === "pill") {
    return (
      <div className={cn("flex items-center p-1 bg-muted/50 rounded-lg relative", className)}>
        <div className="absolute inset-0 p-1">
          {tabs.map((tab, index) => (
            activeTab === tab && (
              <motion.div
                key={tab}
                layoutId="tab-indicator"
                className="absolute h-full bg-primary rounded-md"
                style={{ 
                  width: `calc(100% / ${tabs.length})`,
                  left: `calc(${index} * (100% / ${tabs.length}))`
                }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )
          ))}
        </div>
        
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={cn(
              "flex-1 px-3 py-1.5 text-sm font-medium rounded-md relative z-10 transition-colors",
              activeTab === tab
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    )
  }

  if (variant === "underline") {
    return (
      <div className={cn("flex items-center border-b relative", className)}>
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium relative z-10 transition-colors",
              activeTab === tab
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
          </button>
        ))}
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn("flex items-center p-1 bg-muted/50 rounded-lg", className)}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            activeTab === tab
              ? "text-primary-foreground bg-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  )
} 