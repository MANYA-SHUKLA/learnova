/**
 * Module-level domain stubs — expand when feature work begins.
 * No models or CRUD; shape contracts only.
 */

import type { ID, Timestamps } from '../common/index.js';

export interface CourseStub extends Timestamps {
  id: ID;
  title: string;
  code: string;
  institutionId: ID;
}

export interface ExamStub extends Timestamps {
  id: ID;
  title: string;
  courseId: ID;
  durationMinutes: number;
}

export interface CodingProblemStub extends Timestamps {
  id: ID;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export interface IdeSessionStub {
  id: ID;
  userId: ID;
  language: string;
  status: 'pending' | 'running' | 'stopped' | 'error';
}

export interface AuditLogStub {
  id: ID;
  actorId: ID;
  action: string;
  resource: string;
  resourceId: ID | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AnalyticsMetricStub {
  key: string;
  label: string;
  value: number;
  unit?: string;
  delta?: number;
}
