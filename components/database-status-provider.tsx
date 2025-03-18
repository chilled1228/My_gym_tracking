"use client";

import { useState, useEffect, useRef } from "react";
import { useData } from "@/contexts/data-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface DatabaseStatusProviderProps {
  children?: React.ReactNode
}

export function DatabaseStatusProvider({ children }: DatabaseStatusProviderProps) {
  const { databaseStatus, checkDatabaseSetup, updateDatabaseStatus } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const dismissedRef = useRef(false);
  const router = useRouter();

  // Reset dismissed state when database status changes
  useEffect(() => {
    if (databaseStatus.checked && !databaseStatus.isReady) {
      dismissedRef.current = false;
      setIsDismissed(false);
    }
  }, [databaseStatus]);

  // Handle refresh button click
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await checkDatabaseSetup(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle dismiss
  const handleDismiss = async () => {
    dismissedRef.current = true;
    setIsDismissed(true);
    
    // Update the database status to mark it as dismissed
    if (databaseStatus.checked) {
      try {
        await updateDatabaseStatus({
          ...databaseStatus,
          dismissed: true
        });
      } catch (error) {
        console.error('Error updating database status:', error);
      }
    }
  };

  // Show alert if database is not ready and not dismissed
  const showAlert = databaseStatus.checked && 
                   !databaseStatus.isReady && 
                   !isDismissed && 
                   !databaseStatus.dismissed;

  return (
    <>
      {showAlert && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <Alert variant="destructive" className="shadow-lg">
            <AlertCircle className="h-4 w-4" />
            <div className="flex-1">
              <AlertTitle>Database Setup Required</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  Your Supabase database is missing required tables. Please go to the settings page to set up your database.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="h-8"
                    onClick={() => {
                      router.push('/settings');
                    }}
                  >
                    Go to Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Checking..." : "Refresh"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 ml-auto"
                    onClick={handleDismiss}
                  >
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </div>
          </Alert>
        </div>
      )}
      {children}
    </>
  );
} 