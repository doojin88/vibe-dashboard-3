// src/features/publications/store/publicationStore.ts
import { create } from 'zustand';
import type { PublicationFilters } from '../types';

interface PublicationStore {
  filters: PublicationFilters;
  setFilters: (filters: Partial<PublicationFilters>) => void;
  resetFilters: () => void;
}

export const usePublicationStore = create<PublicationStore>((set) => ({
  filters: {},
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  resetFilters: () => set({ filters: {} }),
}));
