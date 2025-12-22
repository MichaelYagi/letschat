import { useState, useEffect } from 'react';

export function useSoundNotifications(enabled: boolean = true) {
  const [soundEnabled, setSoundEnabled] = useState(enabled);

  useEffect(() => {
    setSoundEnabled(enabled);
  }, [enabled]);

  const playNotificationSound = () => {
    if (!soundEnabled) return;

    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // 800Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  return {
    soundEnabled,
    playNotificationSound,
    toggleSound,
  };
}
