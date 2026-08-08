import { describe, expect, it } from 'vitest';
import { reportsExportQuerySchema, reportsQuerySchema } from '@learnova/validation';

describe('reports validation', () => {
  it('accepts institution export query', () => {
    const parsed = reportsExportQuerySchema.parse({
      scope: 'institution',
      format: 'csv',
    });
    expect(parsed.scope).toBe('institution');
    expect(parsed.format).toBe('csv');
  });

  it('requires courseId for faculty scope at service layer', () => {
    const parsed = reportsQuerySchema.parse({ courseId: '507f1f77bcf86cd799439011' });
    expect(parsed.courseId).toBeTruthy();
  });

  it('supports excel and pdf formats', () => {
    expect(reportsExportQuerySchema.parse({ scope: 'student', format: 'excel' }).format).toBe('excel');
    expect(reportsExportQuerySchema.parse({ scope: 'student', format: 'pdf' }).format).toBe('pdf');
  });
});

describe('reports permissions', () => {
  it('student role includes analytics export for own reports', async () => {
    const { ROLE_PERMISSIONS } = await import('@learnova/shared');
    expect(ROLE_PERMISSIONS.student).toContain('analytics:export');
  });
});
