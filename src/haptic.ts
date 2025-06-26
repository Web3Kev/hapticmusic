// Haptic.ts

let lastVibrateTime = 0;
const VIBRATE_THROTTLE_MS = 100;

export function Haptic(
  intense:number, 
  sharp:number,
  rangeMin?:number,
  rangeMax?:number
){
if (intense && sharp ) {

    let intensity;

    if(rangeMin !== undefined && rangeMax !== undefined)
    {
      if(intense < rangeMin) return;

      const mapForce = (val: number) => {
        if (val >= rangeMax) return 1.0;
        const minVal = rangeMin;
        const maxVal = rangeMax;
        const minMapped = 0.2;
        const maxMapped = 1.0;
        const scaled = (val - minVal) / (maxVal - minVal); 
        return minMapped + scaled * (maxMapped - minMapped);
      };

      intensity = mapForce(intense);
    }
    else
    {
      intensity = intense;
    }
   

    if ((navigator as any).haptic) {
      (navigator as any).haptic([
        { intensity:intensity, sharpness:sharp }
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
}