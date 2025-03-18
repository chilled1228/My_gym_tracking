"use client"

import { ReactNode } from "react"
import { PageTransition } from "./page-transition"
import { NavBar } from "./nav-bar"

interface MobileLayoutProps {
  children: ReactNode
}

export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="flex flex-col min-h-[100dvh] h-full">
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 overscroll-behavior-contain px-2 sm:px-4 md:px-6 pt-4 safe-area-inset-top safe-area-inset-bottom">
        <PageTransition mode="popLayout">
          {children}
        </PageTransition>
      </main>
      
      <NavBar />
    </div>
  )
} 