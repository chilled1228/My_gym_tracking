"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

interface PageTransitionProps {
  children: ReactNode
  className?: string
  mode?: "wait" | "sync" | "popLayout"
}

export function PageTransition({ children, className, mode = "wait" }: PageTransitionProps) {
  const pathname = usePathname()
  
  return (
    <AnimatePresence mode={mode === "popLayout" ? "popLayout" : mode}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ 
          duration: 0.15,
          ease: "easeOut"
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
} 