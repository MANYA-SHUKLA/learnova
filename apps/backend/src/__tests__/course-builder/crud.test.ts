import { describe, it, expect } from 'vitest';
import { courseBuilderService } from '../../services/course-builder/course-builder.service.js';

describe('Course Builder CRUD Smoke Tests', () => {
  describe('Service Methods', () => {
    it('has method to get builder tree', () => {
      expect(typeof courseBuilderService.getBuilderTree).toBe('function');
    });

    it('has method to search builder', () => {
      expect(typeof courseBuilderService.searchBuilder).toBe('function');
    });

    it('has method to reorder', () => {
      expect(typeof courseBuilderService.reorder).toBe('function');
    });
  });

  describe('Module CRUD Methods', () => {
    it('has module CRUD methods', () => {
      expect(typeof courseBuilderService.listModules).toBe('function');
      expect(typeof courseBuilderService.createModule).toBe('function');
      expect(typeof courseBuilderService.getModule).toBe('function');
      expect(typeof courseBuilderService.updateModule).toBe('function');
      expect(typeof courseBuilderService.deleteModule).toBe('function');
      expect(typeof courseBuilderService.restoreModule).toBe('function');
      expect(typeof courseBuilderService.duplicateModule).toBe('function');
      expect(typeof courseBuilderService.archiveModule).toBe('function');
    });
  });

  describe('Lesson CRUD Methods', () => {
    it('has lesson CRUD methods', () => {
      expect(typeof courseBuilderService.listLessons).toBe('function');
      expect(typeof courseBuilderService.createLesson).toBe('function');
      expect(typeof courseBuilderService.getLesson).toBe('function');
      expect(typeof courseBuilderService.updateLesson).toBe('function');
      expect(typeof courseBuilderService.deleteLesson).toBe('function');
      expect(typeof courseBuilderService.restoreLesson).toBe('function');
      expect(typeof courseBuilderService.duplicateLesson).toBe('function');
      expect(typeof courseBuilderService.archiveLesson).toBe('function');
      expect(typeof courseBuilderService.moveLesson).toBe('function');
      expect(typeof courseBuilderService.listLessonVersions).toBe('function');
    });
  });

  describe('Resource CRUD Methods', () => {
    it('has resource CRUD methods', () => {
      expect(typeof courseBuilderService.listResources).toBe('function');
      expect(typeof courseBuilderService.createResource).toBe('function');
      expect(typeof courseBuilderService.updateResource).toBe('function');
      expect(typeof courseBuilderService.deleteResource).toBe('function');
    });
  });

  describe('Autosave Method', () => {
    it('has autosave method', () => {
      expect(typeof courseBuilderService.autosave).toBe('function');
    });
  });
});
