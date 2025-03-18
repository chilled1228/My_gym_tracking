"use client"

import { PageHeader } from "@/components/page-header"
import { MobileLayout } from "@/components/mobile-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MigrateDataCard } from "@/components/migrate-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CloudIcon } from "lucide-react"
import { SetupSupabaseCard } from "@/components/setup-supabase"
import { SaveIndicatorDemo } from "@/components/save-indicator-demo"

export default function SettingsPage() {
  return (
    <MobileLayout>
      <PageHeader
        title="Settings"
        subtitle="Configure your app preferences"
      />
      
      <div className="container px-4 py-6 space-y-8">
        <Tabs defaultValue="data" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="data">Data Storage</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="data" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Settings</CardTitle>
                <CardDescription>
                  Your data storage configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label>Supabase Cloud Storage</Label>
                      <Badge variant="outline" className="bg-primary/10 text-primary">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your data is stored in the cloud for access across devices
                    </p>
                  </div>
                  <CloudIcon className="h-5 w-5 text-primary" />
                </div>
                
                <div className="pt-4 space-y-6">
                  {/* Supabase Setup Card */}
                  <SetupSupabaseCard />
                  
                  {/* Data Migration Card */}
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-2">
                        <div>
                          <h3 className="text-sm font-medium">Data Migration</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            If you previously used the app with local storage, you can migrate your data to Supabase.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <MigrateDataCard />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>App Preferences</CardTitle>
                <CardDescription>
                  Customize your app experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="notifications-toggle">Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders for workouts and meals
                    </p>
                  </div>
                  <Switch id="notifications-toggle" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="dark-mode-toggle">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use dark theme for the app
                    </p>
                  </div>
                  <Switch id="dark-mode-toggle" />
                </div>
              </CardContent>
            </Card>
            
            {/* Save Indicator Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Save Indicator Demo</CardTitle>
                <CardDescription>
                  Test the save indicator functionality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SaveIndicatorDemo />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  )
} 