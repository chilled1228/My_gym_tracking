import { ClearProgressButton } from "./components/ClearProgressButton"

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid gap-8">
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Database Management</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Clear Progress Data</h3>
              <p className="text-muted-foreground mb-4">
                This will delete all workout history, diet history, and macro tracking data from Supabase.
                Your workout plans and diet plans will remain untouched.
              </p>
              <ClearProgressButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 