import { describe, it, expect, beforeAll } from 'vitest';
import { Types } from 'mongoose';
import { ForbiddenError, NotFoundError } from '../../utils/errors/index.js';
import { courseBuilderService } from '../../services/course-builder/course-builder.service.js';
import { CourseModel } from '../../models/course.model.js';
import { CourseModuleModel } from '../../models/course-module.model.js';
import { connectTestDb, closeTestDb, clearTestDb } from '../test-utils.js';

describe('Course Builder Permissions', () => {
  const institutionId = new Types.ObjectId().toString();
  const facultyId1 = new Types.ObjectId().toString();
  const facultyId2 = new Types.ObjectId().toString();
  const studentId = new Types.ObjectId().toString();

  let courseId: string;
  let moduleId: string;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeAll(async () => {
    await clearTestDb();

    const course = await CourseModel.create({
      courseCode: 'CS101',
      slug: 'intro-to-cs',
      title: 'Introduction to Computer Science',
      institutionId: new Types.ObjectId(institutionId),
      facultyIds: [new Types.ObjectId(facultyId1)],
      coordinatorId: new Types.ObjectId(facultyId1),
      status: 'draft',
      visibility: 'institution',
    });
    courseId = course._id.toString();

    const module = await CourseModuleModel.create({
      courseId: course._id,
      institutionId: new Types.ObjectId(institutionId),
      title: 'Module 1',
      slug: 'module-1',
      orderIndex: 0,
    });
    moduleId = module._id.toString();
  });

  describe('Student Access', () => {
    const studentActor = {
      userId: studentId,
      email: 'student@test.com',
      institutionId,
      role: 'student',
    };

    it('should reject student from listing modules', async () => {
      await expect(courseBuilderService.listModules(courseId, studentActor)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('should reject student from creating modules', async () => {
      await expect(
        courseBuilderService.createModule(
          courseId,
          { title: 'New Module', slug: 'new-module' },
          studentActor,
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should reject student from updating modules', async () => {
      await expect(
        courseBuilderService.updateModule(courseId, moduleId, { title: 'Updated' }, studentActor),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should reject student from deleting modules', async () => {
      await expect(
        courseBuilderService.deleteModule(courseId, moduleId, studentActor),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Faculty Access - Assigned Faculty', () => {
    const faculty1Actor = {
      userId: facultyId1,
      email: 'faculty1@test.com',
      institutionId,
      role: 'faculty',
    };

    it('should allow assigned faculty to list modules', async () => {
      const result = await courseBuilderService.listModules(courseId, faculty1Actor);
      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should allow assigned faculty to create modules', async () => {
      const result = await courseBuilderService.createModule(
        courseId,
        { title: 'Faculty Module', slug: 'faculty-module' },
        faculty1Actor,
      );
      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Faculty Module');
    });

    it('should allow assigned faculty to update modules', async () => {
      const result = await courseBuilderService.updateModule(
        courseId,
        moduleId,
        { description: 'Updated description' },
        faculty1Actor,
      );
      expect(result.description).toBe('Updated description');
    });
  });

  describe('Faculty Access - Non-Assigned Faculty', () => {
    const faculty2Actor = {
      userId: facultyId2,
      email: 'faculty2@test.com',
      institutionId,
      role: 'faculty',
    };

    it('should reject non-assigned faculty from listing modules', async () => {
      await expect(courseBuilderService.listModules(courseId, faculty2Actor)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('should reject non-assigned faculty from creating modules', async () => {
      await expect(
        courseBuilderService.createModule(
          courseId,
          { title: 'Unauthorized Module' },
          faculty2Actor,
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Admin Access', () => {
    const adminActor = {
      userId: new Types.ObjectId().toString(),
      email: 'admin@test.com',
      institutionId,
      role: 'admin',
    };

    it('should allow admin to list modules', async () => {
      const result = await courseBuilderService.listModules(courseId, adminActor);
      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should allow admin to create modules', async () => {
      const result = await courseBuilderService.createModule(
        courseId,
        { title: 'Admin Module', slug: 'admin-module' },
        adminActor,
      );
      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Admin Module');
    });

    it('should allow admin to update modules', async () => {
      const result = await courseBuilderService.updateModule(
        courseId,
        moduleId,
        { icon: 'book' },
        adminActor,
      );
      expect(result.icon).toBe('book');
    });

    it('should allow admin to delete modules', async () => {
      const tempModule = await CourseModuleModel.create({
        courseId: new Types.ObjectId(courseId),
        institutionId: new Types.ObjectId(institutionId),
        title: 'Temp Module',
        slug: 'temp-module',
        orderIndex: 99,
      });

      const result = await courseBuilderService.deleteModule(
        courseId,
        tempModule._id.toString(),
        adminActor,
      );
      expect(result.success).toBe(true);
    });
  });
});
