"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Dumbbell, Utensils, BarChart, PieChart, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface NavItem {
  href: string
  icon: LucideIcon
  label: string
}

const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/workout", icon: Dumbbell, label: "Workout" },
  { href: "/diet", icon: Utensils, label: "Diet" },
  { href: "/progress", icon: BarChart, label: "Progress" },
  { href: "/macros", icon: PieChart, label: "Macros" },
]

export function NavBar() {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    // Exact match for home page
    if (path === "/" && pathname === "/") {
      return true
    }
    
    // For other pages, check if the pathname starts with the path
    // But exclude the home path to prevent it from matching all routes
    if (path !== "/" && pathname.startsWith(path)) {
      return true
    }
    
    return false
  }
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 shadow-sm safe-area-inset-bottom">
      <div className="container mx-auto px-1 sm:px-3">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center w-full h-full text-[10px] sm:text-xs relative py-2"
              >
                <div className="relative flex flex-col items-center">
                  <Icon
                    className={cn(
                      "h-5 w-5 mb-1",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      active ? "text-primary font-medium" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
                
                {active && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 right-0 mx-auto w-10 h-0.5 bg-primary rounded-full"
                    initial={false}
                    transition={{ 
                      type: "spring", 
                      stiffness: 500, 
                      damping: 35,
                      duration: 0.15
                    }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
} 