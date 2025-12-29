// Audio utilities for voice chat using Web Audio API
// All functions are standalone and don't conflict with each other

// Initialize audio context once
let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;

// Initialize audio context
const initAudioContext = (): boolean => {
  try {
    audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    gainNode = audioContext.createGain();
    console.log('🎵 Audio context initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize audio context:', error);
    return false;
  }
};

// Create oscillator with gain control
const createOscillator = (
  frequency: number,
  type: OscillatorType = 'sine'
): OscillatorNode => {
  if (!audioContext || !gainNode) {
    if (!initAudioContext()) return null;
  }

  const oscillator = audioContext.createOscillator();
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.type = type;
  return oscillator;
};

// Play ringtone with alternating frequencies
export const playRingtone = (): void => {
  try {
    console.log('🔔 Playing ringtone');

    const oscillator = createOscillator(800, 'sine');
    const gain = gainNode || audioContext?.createGain();

    if (oscillator && gain) {
      oscillator.connect(gain);
      gain.connect(audioContext!.destination);

      const now = audioContext!.currentTime;

      // Create ringtone pattern (alternating frequencies)
      oscillator.frequency.setValueAtTime(800, now);
      oscillator.frequency.setValueAtTime(600, now + 0.3);
      oscillator.frequency.setValueAtTime(800, now + 0.6);
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.setValueAtTime(0.1, now + 0.3);

      oscillator.start(now);

      // Schedule stop after 2 seconds
      setTimeout(() => {
        oscillator.stop(now + 2);
      }, 2000);

      console.log('✅ Ringtone playing');
    }
  } catch (error) {
    console.error('❌ Failed to play ringtone:', error);
  }
};

// Play short accept tone
export const playAcceptSound = (): void => {
  try {
    console.log('✅ Playing accept sound');

    const oscillator = createOscillator(523, 'sine');
    const gain = gainNode || audioContext?.createGain();

    if (oscillator && gain) {
      oscillator.connect(gain);
      gain.connect(audioContext!.destination);

      const now = audioContext!.currentTime;

      // Create ascending tones for acceptance
      oscillator.frequency.setValueAtTime(523, now);
      oscillator.frequency.setValueAtTime(659, now + 0.1);
      oscillator.frequency.setValueAtTime(784, now + 0.2);

      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.setValueAtTime(0.1, now);

      oscillator.start(now);
      oscillator.stop(now + 0.3);

      console.log('✅ Accept sound played');
    }
  } catch (error) {
    console.error('❌ Failed to play accept sound:', error);
  }
};

// Play reject sound with descending sweep
export const playRejectSound = (): void => {
  try {
    console.log('❌ Playing reject sound');

    const oscillator = createOscillator(400, 'sawtooth');
    const gain = gainNode || audioContext?.createGain();

    if (oscillator && gain) {
      oscillator.connect(gain);
      gain.connect(audioContext!.destination);

      const now = audioContext!.currentTime;

      // Descending sweep from high to low
      oscillator.frequency.setValueAtTime(400, now);
      oscillator.frequency.setValueAtTime(350, now + 0.2);
      oscillator.frequency.setValueAtTime(300, now + 0.4);
      oscillator.frequency.setValueAtTime(250, now + 0.3);
      oscillator.type = 'sawtooth';
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.setValueAtTime(0.1, now);

      oscillator.start(now);
      oscillator.stop(now + 0.2);

      console.log('✅ Reject sound played');
    }
  } catch (error) {
    console.error('❌ Failed to play reject sound:', error);
  }
};

// Play end sound
export const playEndSound = (): void => {
  try {
    console.log('📞 Playing end sound');

    const oscillator = createOscillator(880, 'sine');
    const gain = gainNode || audioContext?.createGain();

    if (oscillator && gain) {
      oscillator.connect(gain);
      gain.connect(audioContext!.destination);

      const now = audioContext!.currentTime;
      oscillator.frequency.setValueAtTime(880, now);

      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.1, now);

      oscillator.start(now);
      oscillator.stop(now + 0.1);

      console.log('✅ End sound played');
    }
  } catch (error) {
    console.error('❌ Failed to play end sound:', error);
  }
};

// Play dialing sound
export const playDialingSound = (): void => {
  try {
    console.log('📞 Playing dialing sound');

    const oscillator = createOscillator(440, 'sine');
    const gain = gainNode || audioContext?.createGain();

    if (oscillator && gain) {
      oscillator.connect(gain);
      gain.connect(audioContext!.destination);

      const now = audioContext!.currentTime;

      // Continuous dialing tone
      oscillator.frequency.setValueAtTime(440, now);
      oscillator.frequency.setValueAtTime(0.05, now);

      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0.1, now);

      oscillator.start(now);

      // Pulse the dialing tone
      let pulseCount = 0;
      const pulseInterval = setInterval(() => {
        gain.gain.setValueAtTime(pulseCount % 2 === 0 ? 0.05 : 0.1, now);
        pulseCount++;
      }, 100);

      setTimeout(() => {
        oscillator.stop(now + 2); // Play for 2 seconds
        gain.gain.setValueAtTime(0.1, now);
        pulseCount = 0;
      }, 2000);

      console.log('✅ Dialing sound played');
    }
  } catch (error) {
    console.error('❌ Failed to play dialing sound:', error);
  }
};

// Ringing control for incoming calls
let isRinging = false;
let ringtoneInterval: NodeJS.Timeout | null = null;

export const startRinging = (): void => {
  if (isRinging) return;

  isRinging = true;
  console.log('🔔 Starting ringtone');

  playRingtone();

  // Ring every 3 seconds
  ringtoneInterval = setInterval(() => {
    playRingtone();
  }, 3000);

  console.log('✅ Ringing started');
};

export const stopRinging = (): void => {
  if (!isRinging) return;

  isRinging = false;
  console.log('🔔 Stopping ringtone');

  // Clear interval
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('🔔 Notification permission:', permission);
        return permission === 'granted';
      } else if (Notification.permission === 'granted') {
        return true;
      }
      return false;
    }
    return false;
  } catch (error) {
    console.error('❌ Failed to request notification permission:', error);
    return false;
  }
};

// Show call notification with page title flashing
export const showCallNotification = (title: string, body: string): void => {
  try {
    console.log('📞 Showing call notification:', title);

    // Flash page title
    let isFlashing = false;
    const originalTitle = document.title;
    const titleFlash = setInterval(() => {
      document.title = isFlashing ? originalTitle : `🔔 ${title}`;
      isFlashing = !isFlashing;
    }, 1000);

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `call-${Date.now()}`,
        requireInteraction: true,
      });

      // Clear title flashing when notification is clicked
      notification.onclick = () => {
        clearInterval(titleFlash);
        document.title = originalTitle;
        notification.close();
        window.focus();
      };

      // Auto-clear title flashing after 10 seconds
      setTimeout(() => {
        clearInterval(titleFlash);
        document.title = originalTitle;
      }, 10000);
    }
  } catch (error) {
    console.error('❌ Failed to show call notification:', error);
  }
};

console.log('🎵 Audio utilities loaded');
