import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if localStorage is available in the current environment
 * @returns boolean indicating if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Safely gets an item from localStorage
 * @param key The key to retrieve from localStorage
 * @param defaultValue Default value to return if item doesn't exist or localStorage is unavailable
 * @returns The stored value or defaultValue
 */
export function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    if (!isLocalStorageAvailable()) return defaultValue;
    
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Error getting item ${key} from localStorage:`, e);
    return defaultValue;
  }
}

/**
 * Safely sets an item in localStorage
 * @param key The key to set in localStorage
 * @param value The value to store
 * @returns boolean indicating if the operation was successful
 */
export function safeSetItem<T>(key: string, value: T): boolean {
  try {
    if (!isLocalStorageAvailable()) return false;
    
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Error setting item ${key} in localStorage:`, e);
    return false;
  }
}
