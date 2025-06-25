import { useFrame } from '@react-three/fiber';
import { useAudioStore } from './audioStore';
import { Haptic } from './haptic';

export function AudioController() {
  const updateGains = useAudioStore((s) => s.updateGains);
  const getGains = useAudioStore((s) => s.getGains);

  useFrame(() => {
    updateGains();

    const allGains = getGains(); // Record<string, [gain, sharpness][]>

    for (const gainTuples of Object.values(allGains)) {
      for (const [gain, sharpness] of gainTuples) {
        if (gain > 0.3) {
            // console.log(gain)
          Haptic(gain, sharpness);
        }
      }
    }
  });

  return null;
}