import { create } from 'zustand';

type SoundInstance = {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  analyser: AnalyserNode;
  dataArray: Uint8Array;
  startTime: number;
  offset: number;
  duration?: number;
  sharpness: number;
};

type SoundData = {
  buffer: AudioBuffer;
  instances: SoundInstance[];  // multiple simultaneous plays
};

type AudioStore = {
  context: AudioContext;
  sounds: Record<string, SoundData>;
  loadSound: (key: string, url: string) => Promise<void>;
  play: (
    key: string,
    sharpness?: number,
    loop?: boolean,
    offset?: number,
    duration?: number
  ) => void;
  stop: (key: string) => void;
  stopAll: () => void;
  updateGains: () => void;
  getGains: () => Record<string, Array<[number, number]>>; // key => array of [gain, sharpness]
};

export const useAudioStore = create<AudioStore>((set, get) => {
  const context = new (window.AudioContext || (window as any).webkitAudioContext)();

  return {
    context,
    sounds: {},

    loadSound: async (key, url) => {
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);

      set((state) => ({
        sounds: {
          ...state.sounds,
          [key]: { buffer: audioBuffer, instances: [] },
        },
      }));
    },

    play: (key, sharpness = 0, loop = false, offset = 0, duration) => {
      const { context, sounds } = get();
      const sound = sounds[key];
      if (!sound) return;

      const source = context.createBufferSource();
      source.buffer = sound.buffer;
      source.loop = loop;

      const gainNode = context.createGain();
      const analyser = context.createAnalyser();
      analyser.fftSize = 64;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      source.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(context.destination);

      source.start(0, offset, duration);

      const instance: SoundInstance = {
        source,
        gainNode,
        analyser,
        dataArray,
        startTime: context.currentTime,
        offset,
        duration,
        sharpness,
      };

      // When source ends, remove instance from state
      source.onended = () => {
        set((state) => {
          const sound = state.sounds[key];
          if (!sound) return {};
          return {
            sounds: {
              ...state.sounds,
              [key]: {
                ...sound,
                instances: sound.instances.filter((i) => i.source !== source),
              },
            },
          };
        });
      };

      set((state) => ({
        sounds: {
          ...state.sounds,
          [key]: {
            ...sound,
            instances: [...sound.instances, instance],
          },
        },
      }));
    },

    stop: (key) => {
      const sound = get().sounds[key];
      if (!sound) return;
      sound.instances.forEach((instance) => {
        try {
          instance.source.stop();
        } catch {}
      });
      // Clear all instances
      set((state) => ({
        sounds: {
          ...state.sounds,
          [key]: {
            ...sound,
            instances: [],
          },
        },
      }));
    },

    stopAll: () => {
      const sounds = get().sounds;
      for (const key in sounds) {
        sounds[key].instances.forEach((instance) => {
          try {
            instance.source.stop();
          } catch {}
        });
      }
      set((state) => ({
        sounds: Object.fromEntries(
          Object.entries(state.sounds).map(([key, sound]) => [
            key,
            { ...sound, instances: [] },
          ])
        ),
      }));
    },

    updateGains: () => {
      const sounds = get().sounds;
      const updated: Record<string, SoundData> = {};

      for (const [key, sound] of Object.entries(sounds)) {
        const updatedInstances = sound.instances.map((instance) => {
          instance.analyser.getByteFrequencyData(instance.dataArray);
          const avg =
            instance.dataArray.reduce((a, b) => a + b, 0) /
            instance.dataArray.length;
          // We can set gainNode.gain.value or just track avg here
          return { ...instance, avg };
        });
        updated[key] = { ...sound, instances: updatedInstances };
      }

      set((state) => ({
        sounds: { ...state.sounds, ...updated },
      }));
    },

    getGains: () => {
      const sounds = get().sounds;
      const result: Record<string, Array<[number, number]>> = {};

      for (const [key, sound] of Object.entries(sounds)) {
        const gains = sound.instances.map((inst) => {
          const avg = (inst as any).avg ?? 0;
          return [avg / 255, inst.sharpness] as [number, number];
        });
        if (gains.length > 0) {
          result[key] = gains;
        }
      }

      return result;
    },
  };
});