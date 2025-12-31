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

    // Resume context if suspended (for browser autoplay policies)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    gainNode = audioContext.createGain();
    console.log('🎵 Audio context initialized, state:', audioContext.state);
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

    if (!audioContext || !gainNode) {
      if (!initAudioContext()) return;
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    const now = audioContext.currentTime;

    // Create ringtone pattern (alternating frequencies)
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.setValueAtTime(600, now + 0.3);
    oscillator.frequency.setValueAtTime(800, now + 0.6);
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.1, now);

    oscillator.start(now);

    // Schedule stop after 3 seconds for each ring
    setTimeout(() => {
      try {
        gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
        oscillator.stop(audioContext.currentTime + 0.1);
        console.log('🔔 Ringtone cycle completed');
      } catch (error) {
        console.log('Ringtone cleanup completed');
      }
    }, 3000);

    console.log('✅ Ringtone playing (3 second cycle)');
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
let dialingOscillator: OscillatorNode | null = null;
let dialingGain: GainNode | null = null;
let dialingInterval: NodeJS.Timeout | null = null;

export const playDialingSound = (): void => {
  try {
    console.log('📞 Playing dialing sound');

    if (!audioContext || !gainNode) {
      if (!initAudioContext()) return;
    }

    // Resume context if suspended (for browser autoplay policies)
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('🎵 Audio context resumed');
        playDialingSoundInternal();
      });
      return;
    }

    playDialingSoundInternal();
  } catch (error) {
    console.error('❌ Failed to play dialing sound:', error);
  }
};

const playDialingSoundInternal = (): void => {
  try {
    // Stop any existing dialing sound
    stopDialingSound();

    dialingOscillator = audioContext!.createOscillator();
    dialingGain = audioContext!.createGain();

    dialingOscillator.connect(dialingGain);
    dialingGain.connect(audioContext!.destination);

    const now = audioContext!.currentTime;

    // Configure dialing tone (440 Hz - standard dial tone)
    dialingOscillator.frequency.setValueAtTime(440, now);
    dialingOscillator.type = 'sine';

    // Start with immediate volume (not ramped)
    dialingGain.gain.setValueAtTime(0.1, now);

    dialingOscillator.start(now);

    // Create pulsing dialing effect (on for 1 second, off for 1 second)
    let pulseCount = 0;
    dialingInterval = setInterval(() => {
      if (dialingGain && audioContext) {
        const currentTime = audioContext.currentTime;
        if (pulseCount % 2 === 0) {
          // Turn on - immediate
          dialingGain.gain.setValueAtTime(0.1, currentTime);
        } else {
          // Turn off - ramp down for smooth transition
          dialingGain.gain.linearRampToValueAtTime(0, currentTime + 0.05);
        }
        pulseCount++;
      }
    }, 1000);

    console.log('✅ Dialing sound started');
  } catch (error) {
    console.error('❌ Failed to play dialing sound internal:', error);
  }
};

export const stopDialingSound = (): void => {
  try {
    if (dialingInterval) {
      clearInterval(dialingInterval);
      dialingInterval = null;
    }

    if (dialingOscillator && dialingGain && audioContext) {
      const now = audioContext.currentTime;
      dialingGain.gain.linearRampToValueAtTime(0, now + 0.1);
      dialingOscillator.stop(now + 0.1);
      dialingOscillator = null;
      dialingGain = null;
    }

    console.log('📞 Dialing sound stopped');
  } catch (error) {
    console.error('❌ Failed to stop dialing sound:', error);
  }
};

// Ringing control for incoming calls
let isRinging = false;
let ringtoneInterval: NodeJS.Timeout | null = null;

export const startRinging = (): void => {
  if (isRinging) return;

  isRinging = true;
  console.log('🔔 Starting ringtone');

  // Resume audio context if suspended
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('🎵 Audio context resumed for ringing');
      playRingtone();
    });
  } else {
    playRingtone();
  }

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
