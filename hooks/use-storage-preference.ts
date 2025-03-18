import { useState, useEffect } from 'react';
import { safeGetItem, safeSetItem } from '@/lib/utils';

// Storage preference key
const STORAGE_PREFERENCE_KEY = 'storagePreference';

// Storage types
export type StorageType = 'local' | 'supabase';

/**
 * Hook to manage storage preference between localStorage and Supabase
 */
export function useStoragePreference() {
  const [storageType, setStorageType] = useState<StorageType>('local');
  const [isLoading, setIsLoading] = useState(true);

  // Load preference on mount
  useEffect(() => {
    const savedPreference = safeGetItem<StorageType>(STORAGE_PREFERENCE_KEY, 'local');
    setStorageType(savedPreference);
    setIsLoading(false);
  }, []);

  // Save preference when it changes
  const setPreference = (type: StorageType) => {
    setStorageType(type);
    safeSetItem(STORAGE_PREFERENCE_KEY, type);
  };

  // Helper functions
  const useLocalStorage = storageType === 'local';
  const useSupabase = storageType === 'supabase';

  return {
    storageType,
    setStorageType: setPreference,
    isLoading,
    useLocalStorage,
    useSupabase
  };
} 