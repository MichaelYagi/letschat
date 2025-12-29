// Basic audio file placeholders for voice chat
// In a real implementation, these would be actual sound files

export const playRingtone = () => {
  // Create ringtone using Web Audio API
  const audioContext = new (
    window.AudioContext || (window as any).webkitAudioContext
  )();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Create ringtone pattern (alternating frequencies)
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.3);
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.6);

  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.9);

  // Repeat the ringtone
  const repeatRingtone = () => {
    setTimeout(() => {
      if (oscillator) {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(
          600,
          audioContext.currentTime + 0.3
        );
        oscillator.frequency.setValueAtTime(
          800,
          audioContext.currentTime + 0.6
        );
        oscillator.stop(audioContext.currentTime + 0.9);

        // Continue ringing
        repeatRingtone();
      }
    }, 1000);
  };

  repeatRingtone();
};

export const playAcceptSound = () => {
  // Short accept sound
  const audioContext = new (
    window.AudioContext || (window as any).webkitAudioContext
  )();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
  oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
  oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5

  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.3);
};

export const playRejectSound = () => {
  // Declining frequency sweep
  const audioContext = new (
    window.AudioContext || (window as any).webkitAudioContext
  )();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Descending frequency sweep
  oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.2);

  oscillator.type = 'sawtooth';
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.2);
};

export const playEndSound = () => {
  // Simple beep sound
  const audioContext = new (
    window.AudioContext || (window as any).webkitAudioContext
  )();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1);
};

export const playDialingSound = () => {
  // Continuous dial tone
  const audioContext = new (
    window.AudioContext || (window as any).webkitAudioContext
  )();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.15);

  // Repeat dialing
  setTimeout(() => {
    playDialingSound();
  }, 200);
};

console.log('🎵 Audio utilities loaded');
