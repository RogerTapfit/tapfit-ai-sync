import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Guest mode helper
export function isGuestMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('tapfit_guest') === '1';
  } catch {
    return false;
  }
}

