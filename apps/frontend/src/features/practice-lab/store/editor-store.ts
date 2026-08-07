'use client';

import { create } from 'zustand';
import type { PracticeLanguage } from '@learnova/types';

interface EditorState {
  language: PracticeLanguage;
  sourceCode: string;
  stdin: string;
  fontSize: number;
  wordWrap: boolean;
  theme: 'vs-dark' | 'light';
  setLanguage: (language: PracticeLanguage) => void;
  setSourceCode: (sourceCode: string) => void;
  setStdin: (stdin: string) => void;
  setFontSize: (fontSize: number) => void;
  setWordWrap: (wordWrap: boolean) => void;
  setTheme: (theme: 'vs-dark' | 'light') => void;
  reset: () => void;
}

const initial = {
  language: 'python' as PracticeLanguage,
  sourceCode: '# your code here\n',
  stdin: '',
  fontSize: 14,
  wordWrap: true,
  theme: 'vs-dark' as const,
};

export const usePracticeEditorStore = create<EditorState>((set) => ({
  ...initial,
  setLanguage: (language) => set({ language }),
  setSourceCode: (sourceCode) => set({ sourceCode }),
  setStdin: (stdin) => set({ stdin }),
  setFontSize: (fontSize) => set({ fontSize }),
  setWordWrap: (wordWrap) => set({ wordWrap }),
  setTheme: (theme) => set({ theme }),
  reset: () => set(initial),
}));
