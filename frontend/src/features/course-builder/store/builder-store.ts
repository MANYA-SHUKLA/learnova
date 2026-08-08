/**
 * Course Builder Zustand store — UI state, selection, dirty tracking
 */

import { create } from 'zustand';
import type { BuilderFilter } from '../types';

interface BuilderState {
  selectedModuleId: string | null;
  selectedLessonId: string | null;
  searchQuery: string;
  filters: BuilderFilter;
  isDirty: boolean;
  lastSavedAt: Date | null;
  sidebarCollapsed: boolean;
  propertiesCollapsed: boolean;

  setSelectedModule: (id: string | null) => void;
  setSelectedLesson: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: BuilderFilter) => void;
  setDirty: (dirty: boolean) => void;
  markSaved: () => void;
  toggleSidebar: () => void;
  toggleProperties: () => void;
  reset: () => void;
}

const initialState = {
  selectedModuleId: null,
  selectedLessonId: null,
  searchQuery: '',
  filters: {},
  isDirty: false,
  lastSavedAt: null,
  sidebarCollapsed: false,
  propertiesCollapsed: false,
};

export const useBuilderStore = create<BuilderState>((set) => ({
  ...initialState,

  setSelectedModule: (id) =>
    set({
      selectedModuleId: id,
      selectedLessonId: null,
    }),

  setSelectedLesson: (id) => set({ selectedLessonId: id }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilters: (filters) => set({ filters }),

  setDirty: (dirty) => set({ isDirty: dirty }),

  markSaved: () =>
    set({
      isDirty: false,
      lastSavedAt: new Date(),
    }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  toggleProperties: () => set((state) => ({ propertiesCollapsed: !state.propertiesCollapsed })),

  reset: () => set(initialState),
}));
