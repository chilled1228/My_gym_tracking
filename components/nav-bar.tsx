"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Dumbbell, Utensils, BarChart, PieChart, User, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button"
import { LogOut } from "lucide-react"

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
  const { user, signInWithGoogle, signOut } = useAuth()
  
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
          
          {/* Profile/Login Button */}
          <div className="flex flex-col items-center justify-center w-full h-full text-[10px] sm:text-xs py-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto p-0 bg-transparent relative flex flex-col items-center">
                    <Avatar className="h-5 w-5 mb-1">
                      <AvatarImage src={user.user_metadata.avatar_url} />
                      <AvatarFallback className="text-[8px]">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground">Profile</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                className="h-auto p-0 bg-transparent relative flex flex-col items-center"
                onClick={signInWithGoogle}
              >
                <User className="h-5 w-5 mb-1 text-muted-foreground" />
                <span className="text-muted-foreground">Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 