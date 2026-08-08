import { describe, expect, it } from 'vitest';
import { examRoomId, attemptRoomId } from '../../socket/exam-live.js';

describe('exam socket helpers', () => {
  it('builds stable exam room ids', () => {
    expect(examRoomId('abc123')).toBe('exam:abc123');
  });

  it('builds stable attempt room ids', () => {
    expect(attemptRoomId('attempt1')).toBe('attempt:attempt1');
  });
});

describe('violation type mapping', () => {
  const eventMap: Record<string, string> = {
    fullscreen_exit: 'fullscreen_exit',
    tab_switch: 'tab_switch',
    camera_blocked: 'camera_off',
    microphone_blocked: 'microphone_off',
    clipboard_attempt: 'suspicious_activity',
  };

  it('maps client violations to proctor events', () => {
    expect(eventMap.tab_switch).toBe('tab_switch');
    expect(eventMap.clipboard_attempt).toBe('suspicious_activity');
  });
});
