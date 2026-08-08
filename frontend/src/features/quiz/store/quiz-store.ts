'use client';

import { create } from 'zustand';

interface QuizBuilderDraft {
  quizId: string | null;
  title: string;
  sections: Array<{ title: string; questionIds: string[] }>;
  questionIds: string[];
  dirty: boolean;
  lastSavedAt: string | null;
}

interface QuizBuilderState {
  draft: QuizBuilderDraft;
  setDraft: (partial: Partial<QuizBuilderDraft>) => void;
  resetDraft: () => void;
  markSaved: () => void;
}

const initialDraft: QuizBuilderDraft = {
  quizId: null,
  title: '',
  sections: [],
  questionIds: [],
  dirty: false,
  lastSavedAt: null,
};

export const useQuizBuilderStore = create<QuizBuilderState>((set) => ({
  draft: initialDraft,
  setDraft: (partial) =>
    set((state) => ({
      draft: { ...state.draft, ...partial, dirty: true },
    })),
  resetDraft: () => set({ draft: initialDraft }),
  markSaved: () =>
    set((state) => ({
      draft: {
        ...state.draft,
        dirty: false,
        lastSavedAt: new Date().toISOString(),
      },
    })),
}));
