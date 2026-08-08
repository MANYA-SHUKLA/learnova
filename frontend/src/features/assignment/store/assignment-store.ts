import { create } from 'zustand';
import type { AssignmentStatus } from '@learnova/types';

interface AssignmentFiltersState {
  status: AssignmentStatus | 'all';
  search: string;
  courseId: string;
  setStatus: (status: AssignmentStatus | 'all') => void;
  setSearch: (search: string) => void;
  setCourseId: (courseId: string) => void;
  reset: () => void;
}

const initial = {
  status: 'all' as const,
  search: '',
  courseId: '',
};

export const useAssignmentStore = create<AssignmentFiltersState>((set) => ({
  ...initial,
  setStatus: (status) => { set({ status }); },
  setSearch: (search) => { set({ search }); },
  setCourseId: (courseId) => { set({ courseId }); },
  reset: () => { set(initial); },
}));
