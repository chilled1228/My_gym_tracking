import Link from "next/link"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface CardLinkProps {
  href: string
  icon: LucideIcon
  title: string
  description?: string
  className?: string
}

export function CardLink({ href, icon: Icon, title, description, className }: CardLinkProps) {
  return (
    <Link href={href} className={cn("w-full group", className)}>
      <Card className="shadow-sm h-full border-none transition-all duration-200 hover:shadow-md hover:translate-y-[-2px] group-hover:bg-primary/5">
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-center">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground text-center mt-1">{description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
} 