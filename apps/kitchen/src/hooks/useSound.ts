// apps/kitchen/src/hooks/useSound.ts
import { useCallback } from 'react';
import { getSettings } from '../utils/storage';

export function useSound() {
  const playNewOrder = useCallback(() => {
    const settings = getSettings();
    if (!settings.soundEnabled) return;

    try {
      // Use Web Audio API for reliable sound
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1); // C#6
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);

      gainNode.gain.setValueAtTime(settings.soundVolume * 0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch {
      // Fallback: silent fail
    }
  }, []);

  const playDone = useCallback(() => {
    const settings = getSettings();
    if (!settings.soundEnabled) return;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
      oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(settings.soundVolume * 0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch {
      // Silent fail
    }
  }, []);

  return { playNewOrder, playDone };
}
