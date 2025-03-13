import { ReactNode } from "react"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, backHref, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 py-2">
      <div className="flex items-center gap-2">
        {backHref && (
          <Link 
            href={backHref}
            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        <div>
          <h1 className="text-xl font-bold leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex items-center">
          {action}
        </div>
      )}
    </div>
  )
} 