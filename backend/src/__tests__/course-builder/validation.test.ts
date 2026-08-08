import { describe, it, expect } from 'vitest';
import {
  createCourseModuleSchema,
  updateCourseModuleSchema,
  createCourseLessonSchema,
  createCourseResourceSchema,
  builderReorderSchema,
  builderSearchQuerySchema,
  moveLessonSchema,
} from '@learnova/validation';

describe('Course Builder Validation Schemas', () => {
  describe('createCourseModuleSchema', () => {
    it('should validate a valid module creation', () => {
      const input = {
        title: 'Introduction to TypeScript',
        description: 'Learn the basics of TypeScript',
        orderIndex: 0,
        status: 'draft',
      };

      const result = createCourseModuleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject module with empty title', () => {
      const input = { title: '' };
      const result = createCourseModuleSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject module with title exceeding max length', () => {
      const input = { title: 'a'.repeat(201) };
      const result = createCourseModuleSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('updateCourseModuleSchema', () => {
    it('should allow partial updates', () => {
      const input = { title: 'Updated Title' };
      const result = updateCourseModuleSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should allow empty object for no updates', () => {
      const result = updateCourseModuleSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('createCourseLessonSchema', () => {
    it('should validate a valid lesson creation', () => {
      const input = {
        moduleId: '507f1f77bcf86cd799439011',
        title: 'What is TypeScript?',
        content: 'TypeScript is a typed superset of JavaScript...',
        lessonType: 'rich_text',
        status: 'draft',
      };

      const result = createCourseLessonSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject lesson with invalid moduleId', () => {
      const input = {
        moduleId: 'invalid-id',
        title: 'Test Lesson',
      };
      const result = createCourseLessonSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject lesson with invalid lessonType', () => {
      const input = {
        moduleId: '507f1f77bcf86cd799439011',
        title: 'Test Lesson',
        lessonType: 'invalid_type',
      };
      const result = createCourseLessonSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('createCourseResourceSchema', () => {
    it('should validate a valid resource creation', () => {
      const input = {
        type: 'pdf',
        title: 'TypeScript Handbook',
        url: 'https://example.com/handbook.pdf',
        orderIndex: 0,
      };

      const result = createCourseResourceSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject resource with invalid URL', () => {
      const input = {
        type: 'pdf',
        title: 'Test Resource',
        url: 'not-a-url',
      };
      const result = createCourseResourceSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject resource with invalid type', () => {
      const input = {
        type: 'invalid_type',
        title: 'Test Resource',
      };
      const result = createCourseResourceSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('builderReorderSchema', () => {
    it('should validate reorder with modules, lessons, and resources', () => {
      const input = {
        modules: [
          { id: '507f1f77bcf86cd799439011', orderIndex: 0 },
          { id: '507f1f77bcf86cd799439012', orderIndex: 1 },
        ],
        lessons: [
          {
            id: '507f1f77bcf86cd799439021',
            moduleId: '507f1f77bcf86cd799439011',
            orderIndex: 0,
          },
        ],
        resources: [
          {
            id: '507f1f77bcf86cd799439031',
            lessonId: '507f1f77bcf86cd799439021',
            orderIndex: 0,
          },
        ],
      };

      const result = builderReorderSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should allow empty arrays', () => {
      const input = { modules: [], lessons: [], resources: [] };
      const result = builderReorderSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('builderSearchQuerySchema', () => {
    it('should validate search with query string', () => {
      const input = { q: 'typescript' };
      const result = builderSearchQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should validate search with filters', () => {
      const input = {
        q: 'typescript',
        lessonType: 'video',
        status: 'published',
        isLocked: 'false',
      };
      const result = builderSearchQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('moveLessonSchema', () => {
    it('should validate move lesson with moduleId', () => {
      const input = {
        moduleId: '507f1f77bcf86cd799439011',
        orderIndex: 2,
      };
      const result = moveLessonSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject move with invalid moduleId', () => {
      const input = { moduleId: 'invalid-id' };
      const result = moveLessonSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
