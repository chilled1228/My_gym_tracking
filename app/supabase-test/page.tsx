"use client"

import { SupabaseConnectionTest } from "@/components/supabase-connection-test"
import { MobileLayout } from "@/components/mobile-layout"

export default function SupabaseTestPage() {
  return (
    <MobileLayout>
      <div className="container max-w-md mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
        <p className="text-muted-foreground mb-6">
          Use this page to diagnose Supabase connection issues. If you're having trouble saving macros,
          this will help identify the problem.
        </p>
        
        <SupabaseConnectionTest />
        
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Troubleshooting Steps</h2>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">1. Check Environment Variables</h3>
            <p className="text-sm text-muted-foreground">
              Ensure your <code className="bg-muted px-1 rounded">.env.local</code> file has the correct Supabase URL and anon key.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">2. Verify Database Tables</h3>
            <p className="text-sm text-muted-foreground">
              Make sure the <code className="bg-muted px-1 rounded">macro_history</code> table exists in your Supabase project.
              If it doesn't, you may need to run the database setup script.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">3. Check Network Connectivity</h3>
            <p className="text-sm text-muted-foreground">
              Ensure your device has internet connectivity and can reach the Supabase servers.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">4. Review Supabase Logs</h3>
            <p className="text-sm text-muted-foreground">
              Check the Supabase dashboard for any errors or issues with your project.
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  )
} 