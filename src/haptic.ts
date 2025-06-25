// Haptic.ts

let lastVibrateTime = 0;
const VIBRATE_THROTTLE_MS = 100;

export function Haptic(intensity: number, sharpness:number, min?: number) {

    if (min !== undefined && intensity < min) {
    return; // Below threshold, skip
  }
  // Normalize 0–1, then vibrate or log
  const normalized = Math.min(1, intensity);
//   console.log("Haptic intensity:", normalized);
// console.log("Haptic intensity:", sharpness);
  // navigator.vibrate?.(normalized * 100); // example

  if ((navigator as any).haptic) {
      (navigator as any).haptic([
        { intensity:normalized, sharpness:sharpness }
      ]);
    } 
    else 
    if ("vibrate" in navigator) {

      const now = Date.now();
      if (now - lastVibrateTime < VIBRATE_THROTTLE_MS) {
        return; // Too soon, skip
      }
      lastVibrateTime = now;
      navigator.vibrate(5);
    }
}