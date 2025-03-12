"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Dumbbell, Utensils, BarChart, PieChart } from "lucide-react"

interface MobileLayoutProps {
  children: ReactNode
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    return pathname === path
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-16">
        {children}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="container max-w-md mx-auto px-3">
          <div className="flex items-center justify-around h-16">
            <Link 
              href="/" 
              className={`flex flex-col items-center justify-center w-full h-full text-xs ${
                isActive("/") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Home className="h-5 w-5 mb-1" />
              <span>Home</span>
            </Link>
            
            <Link 
              href="/workout" 
              className={`flex flex-col items-center justify-center w-full h-full text-xs ${
                isActive("/workout") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Dumbbell className="h-5 w-5 mb-1" />
              <span>Workout</span>
            </Link>
            
            <Link 
              href="/diet" 
              className={`flex flex-col items-center justify-center w-full h-full text-xs ${
                isActive("/diet") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Utensils className="h-5 w-5 mb-1" />
              <span>Diet</span>
            </Link>
            
            <Link 
              href="/progress" 
              className={`flex flex-col items-center justify-center w-full h-full text-xs ${
                isActive("/progress") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <BarChart className="h-5 w-5 mb-1" />
              <span>Progress</span>
            </Link>
            
            <Link 
              href="/macros" 
              className={`flex flex-col items-center justify-center w-full h-full text-xs ${
                isActive("/macros") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <PieChart className="h-5 w-5 mb-1" />
              <span>Macros</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
} 