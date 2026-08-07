import { describe, expect, it } from 'vitest';
import {
  PROJECT_DEFAULT_MILESTONES,
  PROJECT_DIFFICULTIES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from '@learnova/constants';
import {
  canTransitionStatus,
  generateSlug,
  ensureUniqueProjectSlug,
} from '../../services/project/project.helpers.js';

describe('project new field constants', () => {
  it('includes enterprise project types', () => {
    expect(PROJECT_TYPES).toContain('mini_project');
    expect(PROJECT_TYPES).toContain('capstone');
    expect(PROJECT_TYPES).toContain('industry_project');
  });

  it('includes open status in lifecycle', () => {
    expect(PROJECT_STATUSES).toContain('open');
    expect(PROJECT_STATUSES).toContain('published');
  });

  it('defines difficulty levels', () => {
    expect(PROJECT_DIFFICULTIES).toContain('beginner');
    expect(PROJECT_DIFFICULTIES).toContain('expert');
  });

  it('seeds seven default milestones', () => {
    expect(PROJECT_DEFAULT_MILESTONES).toHaveLength(7);
    expect(PROJECT_DEFAULT_MILESTONES.map((m) => m.milestoneType)).toContain('proposal');
    expect(PROJECT_DEFAULT_MILESTONES.map((m) => m.milestoneType)).toContain('final_submission');
  });
});

describe('project slug helpers', () => {
  it('generates a lowercase slug from title', () => {
    expect(generateSlug('Capstone Build 2026')).toBe('capstone-build-2026');
  });

  it('deduplicates slugs with numeric suffix', async () => {
    const taken = new Set(['capstone-build', 'capstone-build-1']);
    const slug = await ensureUniqueProjectSlug('inst-1', 'capstone-build', async (candidate) =>
      taken.has(candidate),
    );
    expect(slug).toBe('capstone-build-2');
  });
});

describe('project status transitions', () => {
  it('supports open status after published', () => {
    expect(canTransitionStatus('published', 'open')).toBe(true);
  });

  it('allows open to closed', () => {
    expect(canTransitionStatus('open', 'closed')).toBe(true);
  });
});
