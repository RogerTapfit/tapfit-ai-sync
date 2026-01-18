// Browser notification service for habit reminders
export const habitNotificationService = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  hasPermission(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  },

  showHabitReminder(habitName: string, habitIcon: string): void {
    if (!this.hasPermission()) return;

    new Notification(`${habitIcon} Habit Reminder`, {
      body: `Time to complete: ${habitName}`,
      icon: '/favicon.ico',
      tag: `habit-reminder-${habitName}`,
      requireInteraction: false,
    });
  },

  async playReminderSound(): Promise<void> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Gentle reminder sound
      oscillator.frequency.value = 523.25; // C5 note
      oscillator.type = 'sine';
      gainNode.gain.value = 0.2;

      oscillator.start();
      
      // Play for 300ms then fade out
      setTimeout(() => {
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
        }, 300);
      }, 200);
    } catch (error) {
      console.warn('Could not play reminder sound:', error);
    }
  },

  vibrate(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  },

  sendTestNotification(habitName: string): void {
    if (!this.hasPermission()) return;

    new Notification('✅ Reminder Enabled!', {
      body: `You'll be reminded to: ${habitName}`,
      icon: '/favicon.ico',
      tag: 'habit-reminder-test',
      requireInteraction: false,
    });
  },

  getPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }
};
