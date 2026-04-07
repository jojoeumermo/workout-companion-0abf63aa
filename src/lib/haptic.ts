export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error';

const patterns: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 30,
  heavy: 60,
  success: [20, 50, 20],
  error: [40, 30, 40],
};

export function haptic(style: HapticStyle = 'light') {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(patterns[style]);
    }
  } catch {
    // silently fail - haptics are a nice-to-have
  }
}
