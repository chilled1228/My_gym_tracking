import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { DataProvider } from '@/contexts/data-context'
import { AuthProvider } from '@/contexts/auth-context'
import { DatabaseStatusProvider } from '@/components/database-status-provider'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Fitness Tracker',
  description: 'Track your workouts, diet, and progress',
  generator: 'v0.dev',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased overflow-hidden safe-area-inset-top safe-area-inset-left safe-area-inset-right">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <DataProvider>
              <DatabaseStatusProvider>
                {children}
              </DatabaseStatusProvider>
            </DataProvider>
          </AuthProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
