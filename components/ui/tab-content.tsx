"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface TabContentProps {
  value: string
  activeValue: string
  children: ReactNode
  className?: string
}

export function TabContent({ value, activeValue, children, className }: TabContentProps) {
  const isActive = value === activeValue
  
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
} 