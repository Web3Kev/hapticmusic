import { create } from 'zustand'

interface InstrumentsStore {
  drum: boolean
  snare: boolean
  setDrum: (value: boolean) => void
  setSnare: (value: boolean) => void
  toggleDrum: () => void
  toggleSnare: () => void
}

export const useInstrumentsStore = create<InstrumentsStore>((set) => ({
  drum: true,
  snare: true,
  setDrum: (value) => set({ drum: value }),
  setSnare: (value) => set({ snare: value }),
  toggleDrum: () => set((state) => ({ drum: !state.drum })),
  toggleSnare: () => set((state) => ({ snare: !state.snare })),
}))