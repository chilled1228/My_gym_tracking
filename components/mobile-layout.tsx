"use client"

import { ReactNode } from "react"
import { PageTransition } from "./page-transition"
import { NavBar } from "./nav-bar"

interface MobileLayoutProps {
  children: ReactNode
}

export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 overscroll-behavior-y-contain">
        <PageTransition mode="popLayout">
          {children}
        </PageTransition>
      </main>
      
      <NavBar />
    </div>
  )
} 