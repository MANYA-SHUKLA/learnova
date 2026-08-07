/**
 * Course Controller - HTTP handlers for course endpoints
 */

import type { Request, Response } from 'express';
import { courseService } from '../../services/course/course.service.js';
import {
  createCourseSchema,
  updateCourseSchema,
  listCoursesSchema,
} from '@learnova/validation';
import { sendSuccess, sendError } from '../../utils/response/index.js';
import { ValidationError } from '../../utils/errors/index.js';

export async function getCourse(req: Request, res: Response): Promise<void> {
  try {
    const course = await courseService.getCourse(req.params.id);
    sendSuccess(res, course, { requestId: req.requestId });
  } catch (err) {
    sendError(res, err, { requestId: req.requestId });
  }
}

export async function listCourses(req: Request, res: Response): Promise<void> {
  try {
    const validated = listCoursesSchema.parse(req.query);
    const institutionId = req.user?.institutionId;
    if (!institutionId) {
      throw new ValidationError('Institution ID is required');
    }
    
    const result = await courseService.listCourses(validated, institutionId);
    sendSuccess(res, result.items, { requestId: req.requestId, meta: result.meta });
  } catch (err) {
    sendError(res, err, { requestId: req.requestId });
  }
}

export async function createCourse(req: Request, res: Response): Promise<void> {
  try {
    const validated = createCourseSchema.parse(req.body);
    const institutionId = req.user?.institutionId;
    const userId = req.user?.sub;
    
    if (!institutionId || !userId) {
      throw new ValidationError('Institution ID and User ID are required');
    }
    
    const course = await courseService.createCourse(validated, institutionId, userId);
    sendSuccess(res, course, { status: 201, requestId: req.requestId });
  } catch (err) {
    sendError(res, err, { requestId: req.requestId });
  }
}

export async function updateCourse(req: Request, res: Response): Promise<void> {
  try {
    const validated = updateCourseSchema.parse(req.body);
    const userId = req.user?.sub;
    
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    
    const course = await courseService.updateCourse(req.params.id, validated, userId);
    sendSuccess(res, course, { requestId: req.requestId });
  } catch (err) {
    sendError(res, err, { requestId: req.requestId });
  }
}

export async function deleteCourse(req: Request, res: Response): Promise<void> {
  try {
    await courseService.deleteCourse(req.params.id);
    sendSuccess(res, { message: 'Course deleted successfully' }, { requestId: req.requestId });
  } catch (err) {
    sendError(res, err, { requestId: req.requestId });
  }
}

export async function publishCourse(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    
    const course = await courseService.publishCourse(req.params.id, userId);
    sendSuccess(res, course, { requestId: req.requestId });
  } catch (err) {
    sendError(res, err, { requestId: req.requestId });
  }
}

export async function archiveCourse(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    
    const course = await courseService.archiveCourse(req.params.id, userId);
    sendSuccess(res, course, { requestId: req.requestId });
  } catch (err) {
    sendError(res, err, { requestId: req.requestId });
  }
}

export async function getCourseStats(req: Request, res: Response): Promise<void> {
  try {
    const institutionId = req.user?.institutionId;
    if (!institutionId) {
      throw new ValidationError('Institution ID is required');
    }
    
    const stats = await courseService.getCourseStats(institutionId);
    sendSuccess(res, stats, { requestId: req.requestId });
  } catch (err) {
    sendError(res, err, { requestId: req.requestId });
  }
}
