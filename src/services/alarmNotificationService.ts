// Browser notification service for fitness alarms
export const alarmNotificationService = {
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

  showAlarmNotification(alarmLabel: string, pushUpCount: number): void {
    if (!this.hasPermission()) return;

    new Notification('⏰ Fitness Alarm!', {
      body: `Time to wake up! Complete ${pushUpCount} push-ups to turn off the alarm.`,
      icon: '/favicon.ico',
      tag: 'fitness-alarm',
      requireInteraction: true,
    });
  },

  async playAlarmSound(soundType: string = 'classic'): Promise<HTMLAudioElement> {
    // Create audio context for alarm sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different sound profiles
    switch (soundType) {
      case 'siren':
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.5;
        break;
      case 'horn':
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.7;
        break;
      default: // classic
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.3;
    }

    oscillator.start();

    // Return a pseudo HTMLAudioElement for compatibility
    return {
      pause: () => oscillator.stop(),
      play: () => oscillator.start(),
    } as HTMLAudioElement;
  },

  vibrate(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }
  }
};
