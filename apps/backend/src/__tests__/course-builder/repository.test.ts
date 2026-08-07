import { describe, it, expect } from 'vitest';
import { builderRepository } from '../../repositories/course-builder/builder.repository.js';

describe('Builder Repository', () => {
  describe('Repository Methods', () => {
    it('has method to create module', () => {
      expect(typeof builderRepository.createModule).toBe('function');
    });

    it('has method to list modules by course', () => {
      expect(typeof builderRepository.listModulesByCourse).toBe('function');
    });

    it('has method to soft delete module', () => {
      expect(typeof builderRepository.softDeleteModule).toBe('function');
    });

    it('has method to restore module', () => {
      expect(typeof builderRepository.restoreModule).toBe('function');
    });

    it('has method to duplicate module', () => {
      expect(typeof builderRepository.duplicateModule).toBe('function');
    });

    it('has method to reorder modules', () => {
      expect(typeof builderRepository.reorderModules).toBe('function');
    });
  });

  describe('Lesson Methods', () => {
    it('has method to create lesson', () => {
      expect(typeof builderRepository.createLesson).toBe('function');
    });

    it('has method to list lessons by module', () => {
      expect(typeof builderRepository.listLessonsByModule).toBe('function');
    });

    it('has method to move lesson to module', () => {
      expect(typeof builderRepository.moveLessonToModule).toBe('function');
    });

    it('has method to list lesson versions', () => {
      expect(typeof builderRepository.listLessonVersions).toBe('function');
    });
  });

  describe('Resource Methods', () => {
    it('has method to create resource', () => {
      expect(typeof builderRepository.createResource).toBe('function');
    });

    it('has method to list resources by lesson', () => {
      expect(typeof builderRepository.listResourcesByLesson).toBe('function');
    });

    it('has method to soft delete resource', () => {
      expect(typeof builderRepository.softDeleteResource).toBe('function');
    });
  });

  describe('Builder Tree', () => {
    it('has method to get builder tree', () => {
      expect(typeof builderRepository.getBuilderTree).toBe('function');
    });

    it('has method to search builder', () => {
      expect(typeof builderRepository.searchBuilder).toBe('function');
    });
  });

  describe('Audit Methods', () => {
    it('has method to log audit events', () => {
      expect(typeof builderRepository.logAudit).toBe('function');
    });
  });
});
