import create from 'zustand';

interface AppState {
  selectedStartupId: string | null;
  setSelectedStartupId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedStartupId: null,
  setSelectedStartupId: (id) => set({ selectedStartupId: id }),
})); 