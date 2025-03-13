import { useEffect, useRef } from 'react'

/**
 * Custom hook to show a sync indicator when data is saved
 * @returns A function to trigger the sync indicator
 */
export function useSyncIndicator() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  /**
   * Show the sync indicator for a brief moment
   */
  const showSyncIndicator = () => {
    // Find the indicator element
    const indicator = document.getElementById('sync-indicator')
    if (!indicator) return
    
    // Show the indicator with animation
    indicator.classList.remove('opacity-0', 'scale-75')
    indicator.classList.add('opacity-100', 'scale-100')
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Hide the indicator after a delay
    timeoutRef.current = setTimeout(() => {
      indicator.classList.remove('opacity-100', 'scale-100')
      indicator.classList.add('opacity-0', 'scale-75')
    }, 1500)
  }
  
  return showSyncIndicator
} 