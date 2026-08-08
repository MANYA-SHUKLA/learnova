'use client';

import { create } from 'zustand';
import type { LearningStatus } from '@learnova/types';

export type ProgressStatusFilter = LearningStatus | 'all';

interface ProgressFilterState {
  status: ProgressStatusFilter;
  search: string;
  recent: boolean;
  bookmarked: boolean;
  setStatus: (status: ProgressStatusFilter) => void;
  setSearch: (search: string) => void;
  setRecent: (recent: boolean) => void;
  setBookmarked: (bookmarked: boolean) => void;
  resetFilters: () => void;
}

const initialFilters = {
  status: 'all' as ProgressStatusFilter,
  search: '',
  recent: false,
  bookmarked: false,
};

export const useProgressStore = create<ProgressFilterState>((set) => ({
  ...initialFilters,
  setStatus: (status) => { set({ status }); },
  setSearch: (search) => { set({ search }); },
  setRecent: (recent) => { set({ recent }); },
  setBookmarked: (bookmarked) => { set({ bookmarked }); },
  resetFilters: () => { set(initialFilters); },
}));
