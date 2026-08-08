'use client';

import { create } from 'zustand';

export interface ExamLiveStats {
  online: number;
  started: number;
  submitted: number;
  disconnected: number;
  warnings: number;
  violations: number;
}

interface ExamStoreState {
  activeAttemptId: string | null;
  activeExamId: string | null;
  remainingSeconds: number | null;
  violationCount: number;
  warnings: string[];
  liveStats: ExamLiveStats | null;
  secureModeEnabled: boolean;
  cameraGranted: boolean;
  microphoneGranted: boolean;
  setActiveAttempt: (examId: string, attemptId: string) => void;
  clearActiveAttempt: () => void;
  setRemainingSeconds: (seconds: number | null) => void;
  incrementViolations: () => void;
  addWarning: (message: string) => void;
  setLiveStats: (stats: ExamLiveStats | null) => void;
  setSecureModeEnabled: (enabled: boolean) => void;
  setMediaPermissions: (camera: boolean, microphone: boolean) => void;
}

export const useExamStore = create<ExamStoreState>((set) => ({
  activeAttemptId: null,
  activeExamId: null,
  remainingSeconds: null,
  violationCount: 0,
  warnings: [],
  liveStats: null,
  secureModeEnabled: false,
  cameraGranted: false,
  microphoneGranted: false,
  setActiveAttempt: (examId, attemptId) =>
    { set({ activeExamId: examId, activeAttemptId: attemptId, violationCount: 0, warnings: [] }); },
  clearActiveAttempt: () =>
    { set({
      activeExamId: null,
      activeAttemptId: null,
      remainingSeconds: null,
      violationCount: 0,
      warnings: [],
      secureModeEnabled: false,
    }); },
  setRemainingSeconds: (seconds) => { set({ remainingSeconds: seconds }); },
  incrementViolations: () => { set((s) => ({ violationCount: s.violationCount + 1 })); },
  addWarning: (message) => { set((s) => ({ warnings: [...s.warnings, message] })); },
  setLiveStats: (stats) => { set({ liveStats: stats }); },
  setSecureModeEnabled: (enabled) => { set({ secureModeEnabled: enabled }); },
  setMediaPermissions: (camera, microphone) =>
    { set({ cameraGranted: camera, microphoneGranted: microphone }); },
}));
