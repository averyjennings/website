import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HeatmapStore {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
  toggle: () => void;
}

export const useHeatmapStore = create<HeatmapStore>()(
  persist(
    (set) => ({
      isVisible: true, // Enabled by default
      setIsVisible: (isVisible) => set({ isVisible }),
      toggle: () => set((state) => ({ isVisible: !state.isVisible })),
    }),
    {
      name: 'heatmap-storage',
    }
  )
);