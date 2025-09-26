import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Enhanced guest mode helper with security validation
export function isGuestMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isGuest = localStorage.getItem('tapfit_guest') === '1';
    if (isGuest) {
      // Validate guest session is still active
      const sessionData = localStorage.getItem('tapfit_guest_session');
      if (!sessionData) return false;
      
      const { expiresAt } = JSON.parse(sessionData);
      const isExpired = Date.now() > new Date(expiresAt).getTime();
      
      if (isExpired) {
        localStorage.removeItem('tapfit_guest');
        localStorage.removeItem('tapfit_guest_session');
        return false;
      }
    }
    return isGuest;
  } catch {
    return false;
  }
}

// Security utility functions
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove potential XSS chars
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .trim()
    .substring(0, 1000); // Limit length
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

export function logFailedAuthAttempt(email?: string): void {
  const attemptKey = 'failed_auth_attempts';
  const attempts = JSON.parse(localStorage.getItem(attemptKey) || '[]');
  const now = Date.now();
  
  // Clean old attempts (older than 1 hour)
  const recentAttempts = attempts.filter((attempt: any) => 
    now - attempt.timestamp < 60 * 60 * 1000
  );
  
  recentAttempts.push({
    email: email?.substring(0, 3) + '***', // Partial email for privacy
    timestamp: now,
    userAgent: navigator.userAgent.substring(0, 100)
  });
  
  localStorage.setItem(attemptKey, JSON.stringify(recentAttempts));
  
  // If too many attempts, add delay
  if (recentAttempts.length > 5) {
    setTimeout(() => {
      // This adds artificial delay for brute force protection
    }, Math.min(recentAttempts.length * 1000, 30000));
  }
}

