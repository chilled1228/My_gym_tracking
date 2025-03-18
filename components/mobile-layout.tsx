"use client"

import { ReactNode } from "react"
import { PageTransition } from "./page-transition"
import { NavBar } from "./nav-bar"
import { LoginButton } from "./login-button"

interface MobileLayoutProps {
  children: ReactNode
}

export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="flex flex-col min-h-[100dvh] h-full">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container flex justify-between items-center h-14 px-2 sm:px-4 md:px-6">
          <h1 className="text-lg font-semibold">Fitness Tracker</h1>
          <LoginButton />
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 overscroll-behavior-contain px-2 sm:px-4 md:px-6 safe-area-inset-bottom">
        <PageTransition mode="popLayout">
          {children}
        </PageTransition>
      </main>
      
      <NavBar />
    </div>
  )
} 