"use client"

import { ReactNode, useState } from "react"
import { cn } from "@/lib/utils"
import { TabIndicator } from "./tab-indicator"
import { TabContent } from "./tab-content"

interface SmoothTabsProps {
  defaultValue?: string
  className?: string
  tabsClassName?: string
  contentClassName?: string
  variant?: "default" | "pill" | "underline"
  children: ReactNode
}

interface SmoothTabProps {
  value: string
  title: string
  children: ReactNode
  className?: string
}

export function SmoothTabs({
  defaultValue,
  className,
  tabsClassName,
  contentClassName,
  variant = "default",
  children,
}: SmoothTabsProps) {
  // Find the first tab value if no default is provided
  const firstTabValue = Array.isArray(children)
    ? (children.find(child => 
        child && typeof child === 'object' && 'props' in child && child.props.value
      ) as any)?.props.value
    : undefined
  
  const [activeTab, setActiveTab] = useState(defaultValue || firstTabValue || "")
  
  // Extract tab titles from children
  const tabs = Array.isArray(children)
    ? children
        .filter(child => child && typeof child === 'object' && 'props' in child && child.props.value)
        .map(child => ({
          value: (child as any).props.value,
          title: (child as any).props.title,
        }))
    : []
  
  return (
    <div className={className}>
      <TabIndicator
        tabs={tabs.map(tab => tab.title)}
        activeTab={tabs.find(tab => tab.value === activeTab)?.title || ""}
        onChange={(title) => {
          const tab = tabs.find(tab => tab.title === title)
          if (tab) setActiveTab(tab.value)
        }}
        variant={variant}
        className={tabsClassName}
      />
      
      <div className={cn("mt-4", contentClassName)}>
        {Array.isArray(children) &&
          children.map(child => {
            if (!child || typeof child !== 'object' || !('props' in child)) return null
            
            const { value, className } = (child as any).props
            
            return (
              <TabContent
                key={value}
                value={value}
                activeValue={activeTab}
                className={className}
              >
                {child}
              </TabContent>
            )
          })}
      </div>
    </div>
  )
}

export function SmoothTab({ value, title, children, className }: SmoothTabProps) {
  return <div className={className}>{children}</div>
} 