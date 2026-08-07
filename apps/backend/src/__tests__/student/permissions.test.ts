import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@learnova/constants';

describe('student permissions', () => {
  it('defines student:read permission', () => {
    expect(PERMISSIONS.STUDENT_READ).toBe('student:read');
  });

  it('defines student:write permission', () => {
    expect(PERMISSIONS.STUDENT_WRITE).toBe('student:write');
  });

  it('defines student:manage permission', () => {
    expect(PERMISSIONS.STUDENT_MANAGE).toBe('student:manage');
  });
});
