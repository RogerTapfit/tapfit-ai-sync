import { supabase } from '@/integrations/supabase/client';

// Guest session management with 30-minute timeout
export class GuestSessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly SESSION_KEY = 'tapfit_guest_session';
  private static sessionToken: string | null = null;
  private static sessionTimer: NodeJS.Timeout | null = null;

  static generateSessionToken(): string {
    return crypto.randomUUID();
  }

  static async createGuestSession(): Promise<string> {
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + this.SESSION_TIMEOUT);

    try {
      // Create guest session in database
      const { error } = await supabase
        .from('guest_sessions')
        .insert({
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent
        });

      if (error) {
        console.warn('Failed to create guest session in database:', error);
      }

      // Store session locally
      localStorage.setItem(this.SESSION_KEY, JSON.stringify({
        token: sessionToken,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString()
      }));

      this.sessionToken = sessionToken;
      this.startSessionTimer();

      // Log security event
      await this.logSecurityEvent('guest_session_created', {
        session_token: sessionToken.substring(0, 8) + '...',
        expires_at: expiresAt.toISOString()
      });

      return sessionToken;
    } catch (error) {
      console.error('Error creating guest session:', error);
      throw error;
    }
  }

  static async validateGuestSession(): Promise<boolean> {
    const sessionData = localStorage.getItem(this.SESSION_KEY);
    if (!sessionData) {
      return false;
    }

    try {
      const { token, expiresAt } = JSON.parse(sessionData);
      const expiry = new Date(expiresAt);

      // Check if session is expired locally
      if (Date.now() > expiry.getTime()) {
        await this.clearGuestSession();
        return false;
      }

      // Validate with database
      const { data: isValid } = await supabase
        .rpc('validate_guest_session', { session_token: token });

      if (!isValid) {
        await this.clearGuestSession();
        return false;
      }

      this.sessionToken = token;
      this.startSessionTimer();
      return true;
    } catch (error) {
      console.error('Error validating guest session:', error);
      await this.clearGuestSession();
      return false;
    }
  }

  static async clearGuestSession(): Promise<void> {
    const sessionData = localStorage.getItem(this.SESSION_KEY);
    
    if (sessionData && this.sessionToken) {
      try {
        // Log security event
        await this.logSecurityEvent('guest_session_ended', {
          session_token: this.sessionToken.substring(0, 8) + '...'
        });

        // Clean up database session
        await supabase
          .from('guest_sessions')
          .delete()
          .eq('session_token', this.sessionToken);
      } catch (error) {
        console.error('Error clearing guest session from database:', error);
      }
    }

    // Clear local storage
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem('tapfit_guest');

    // Clear timers
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    this.sessionToken = null;
  }

  static startSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(async () => {
      await this.clearGuestSession();
      // Redirect to auth page or show session expired message
      window.location.href = '/auth';
    }, this.SESSION_TIMEOUT);
  }

  static isGuestSessionActive(): boolean {
    const sessionData = localStorage.getItem(this.SESSION_KEY);
    if (!sessionData) return false;

    try {
      const { expiresAt } = JSON.parse(sessionData);
      return Date.now() < new Date(expiresAt).getTime();
    } catch {
      return false;
    }
  }

  static getGuestSessionToken(): string | null {
    return this.sessionToken;
  }

  private static async getClientIP(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  }

  private static async logSecurityEvent(eventType: string, details: any): Promise<void> {
    try {
      await supabase.rpc('log_security_event', {
        _user_id: null,
        _event_type: eventType,
        _event_details: details,
        _ip_address: await this.getClientIP(),
        _user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

// Guest access limitations
export const GUEST_LIMITATIONS = {
  maxFoodEntries: 5,
  maxWorkoutSessions: 3,
  maxPhotoUploads: 3,
  restrictedFeatures: [
    'export_data',
    'sync_devices',
    'premium_features',
    'challenges',
    'achievements'
  ]
};

export function checkGuestLimitation(feature: string, currentCount?: number): {
  allowed: boolean;
  message?: string;
} {
  if (!localStorage.getItem('tapfit_guest')) {
    return { allowed: true };
  }

  // Check specific feature restrictions
  if (GUEST_LIMITATIONS.restrictedFeatures.includes(feature)) {
    return {
      allowed: false,
      message: 'This feature requires a TapFit account. Sign up to unlock!'
    };
  }

  // Check count-based limitations
  const limits: Record<string, number> = {
    food_entries: GUEST_LIMITATIONS.maxFoodEntries,
    workout_sessions: GUEST_LIMITATIONS.maxWorkoutSessions,
    photo_uploads: GUEST_LIMITATIONS.maxPhotoUploads
  };

  const limit = limits[feature];
  if (limit && currentCount !== undefined && currentCount >= limit) {
    return {
      allowed: false,
      message: `Guest mode limit reached (${limit}). Create an account for unlimited access!`
    };
  }

  return { allowed: true };
}