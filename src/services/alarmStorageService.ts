// Local storage service for alarm state persistence
const ALARM_STATE_KEY = 'tapfit_alarm_state';
const RINGING_ALARM_KEY = 'tapfit_ringing_alarm';

export interface AlarmState {
  lastCheck: string;
  activeAlarms: string[];
}

export const alarmStorageService = {
  getAlarmState(): AlarmState | null {
    const stored = localStorage.getItem(ALARM_STATE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  setAlarmState(state: AlarmState): void {
    localStorage.setItem(ALARM_STATE_KEY, JSON.stringify(state));
  },

  setRingingAlarm(alarmId: string): void {
    localStorage.setItem(RINGING_ALARM_KEY, alarmId);
  },

  getRingingAlarm(): string | null {
    return localStorage.getItem(RINGING_ALARM_KEY);
  },

  clearRingingAlarm(): void {
    localStorage.removeItem(RINGING_ALARM_KEY);
  },

  updateLastCheck(): void {
    const state = this.getAlarmState() || { lastCheck: new Date().toISOString(), activeAlarms: [] };
    state.lastCheck = new Date().toISOString();
    this.setAlarmState(state);
  }
};
