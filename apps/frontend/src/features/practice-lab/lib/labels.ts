import type { PracticeDifficulty, PracticeLabStatus, SubmissionVerdict } from '@learnova/types';

export function formatDifficulty(value: PracticeDifficulty) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatLabStatus(value: PracticeLabStatus) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatVerdict(value: SubmissionVerdict) {
  return value
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}
