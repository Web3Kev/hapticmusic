import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useAudioStore } from './audioStore';
import { AudioController } from './AudioController';

export default function Experience() {
  const load = useAudioStore((s) => s.loadSound);
  const play = useAudioStore((s) => s.play);
  const stop = useAudioStore((s) => s.stop);
  const stopAll = useAudioStore((s) => s.stopAll);

  useEffect(() => {
    load('shamisen', './shamisen.mp3');
    load('tiger', './tiger.mp3');
  }, []);

  return (
    <>
      <Canvas>
        <AudioController />
      </Canvas>
        <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
      <button onClick={() => play('shamisen', 1.0)}>Play shamisen</button>
      <button onClick={() => play('tiger', 0.9)}>Playtiger (1s)</button>
      <button onClick={() => stop('shamisen')}>STOP shamisen</button>
          <button onClick={() => stopAll()}>STOP ALL</button>
      </div>
    </>
  );
}