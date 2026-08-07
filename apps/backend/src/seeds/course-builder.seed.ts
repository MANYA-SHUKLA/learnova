import { Types } from 'mongoose';
import slugify from 'slugify';
import { CourseModel } from '../models/course.model.js';
import { CourseModuleModel } from '../models/course-module.model.js';
import { CourseLessonModel } from '../models/course-lesson.model.js';
import { CourseResourceModel } from '../models/course-resource.model.js';
import { CourseLessonVersionModel } from '../models/course-lesson-version.model.js';
import { logger } from '../utils/logger/index.js';

const MODULE_TITLES = [
  'Getting Started',
  'Fundamentals',
  'Core Concepts',
  'Advanced Topics',
  'Best Practices',
  'Practical Applications',
  'Case Studies',
  'Project Work',
];

const LESSON_TYPES = [
  'rich_text',
  'video',
  'markdown',
  'pdf',
  'presentation',
  'code_snippet',
] as const;

const LESSON_TITLES = [
  'Introduction to the Topic',
  'Key Terminology',
  'Fundamental Principles',
  'Hands-on Tutorial',
  'Advanced Techniques',
  'Common Pitfalls',
  'Best Practices Guide',
  'Real-World Example',
  'Quiz and Assessment',
  'Summary and Review',
];

const RESOURCE_TYPES = ['pdf', 'external_link', 'video', 'image'] as const;

const RESOURCE_TITLES = [
  'Quick Reference Guide',
  'Cheat Sheet',
  'Additional Reading',
  'Video Tutorial',
  'Official Documentation',
  'Sample Code Repository',
  'Practice Exercises',
];

function generateSlug(title: string, suffix?: string): string {
  const base = slugify(title, { lower: true, strict: true });
  return suffix ? `${base}-${suffix}` : base;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateLessonContent(lessonTitle: string, lessonType: string): string {
  const intro = `# ${lessonTitle}\n\n`;
  const body = `This lesson covers ${lessonTitle.toLowerCase()} in detail.\n\n`;
  const points = [
    '- Understanding core concepts',
    '- Practical applications',
    '- Common challenges and solutions',
    '- Tips and best practices',
  ].join('\n');

  if (lessonType === 'video') {
    return `${intro}${body}Video content discussing:\n\n${points}\n\n**Duration:** 15-20 minutes`;
  } else if (lessonType === 'code_snippet') {
    return `${intro}${body}\`\`\`javascript\n// Example code\nfunction example() {\n  console.log('Hello World');\n}\n\`\`\`\n\n${points}`;
  }

  return `${intro}${body}Key points:\n\n${points}\n\n## Summary\n\nThis lesson provides a comprehensive overview of the topic.`;
}

export async function seedCourseBuilder(institutionId: string): Promise<void> {
  logger.info('Starting course builder seed...');

  const institutionOid = new Types.ObjectId(institutionId);

  let courses = await CourseModel.find({ institutionId: institutionOid, deletedAt: null })
    .limit(30)
    .exec();

  const targetCourseCount = 30;
  if (courses.length < targetCourseCount) {
    logger.info(
      `Found only ${courses.length} courses, creating ${targetCourseCount - courses.length} minimal courses...`,
    );

    const coursesToCreate = targetCourseCount - courses.length;
    for (let i = 0; i < coursesToCreate; i++) {
      const courseNumber = courses.length + i + 1;
      const title = `Course ${courseNumber}`;
      const courseCode = `CS${String(courseNumber).padStart(3, '0')}`;

      const course = await CourseModel.create({
        courseCode,
        slug: generateSlug(title),
        title,
        institutionId: institutionOid,
        status: 'draft',
        visibility: 'institution',
        category: 'general',
        difficulty: 'beginner',
        language: 'en',
      });
      courses.push(course);
    }
    logger.info(`Created ${coursesToCreate} minimal courses`);
  }

  logger.info(`Processing ${courses.length} courses...`);

  let totalModules = 0;
  let totalLessons = 0;
  let totalResources = 0;

  for (const course of courses) {
    const existingModulesCount = await CourseModuleModel.countDocuments({
      courseId: course._id,
      deletedAt: null,
    });

    if (existingModulesCount > 0) {
      logger.info(
        `Course ${course.courseCode} already has ${existingModulesCount} modules, skipping...`,
      );
      continue;
    }

    const numModules = Math.floor(Math.random() * 3) + 2;

    for (let m = 0; m < numModules; m++) {
      const moduleTitle = MODULE_TITLES[m % MODULE_TITLES.length];
      const module = await CourseModuleModel.create({
        courseId: course._id,
        institutionId: institutionOid,
        title: `${moduleTitle} - ${course.title}`,
        slug: generateSlug(moduleTitle, String(course._id).slice(-6)),
        description: `This module covers ${moduleTitle.toLowerCase()} for ${course.title}.`,
        moduleNumber: m + 1,
        orderIndex: m,
        estimatedMinutes: Math.floor(Math.random() * 180) + 60,
        visibility: 'enrolled',
        status: m === 0 ? 'published' : 'draft',
        icon: 'book',
        isLocked: false,
      });
      totalModules++;

      const numLessons = Math.floor(Math.random() * 6) + 4;

      for (let l = 0; l < numLessons; l++) {
        const lessonTitle = LESSON_TITLES[l % LESSON_TITLES.length];
        const lessonType = getRandomElement([...LESSON_TYPES]);

        const lesson = await CourseLessonModel.create({
          courseId: course._id,
          moduleId: module._id,
          institutionId: institutionOid,
          title: `${lessonTitle}`,
          slug: generateSlug(
            `${moduleTitle}-${lessonTitle}`,
            String(module._id).slice(-6),
          ),
          lessonNumber: l + 1,
          orderIndex: l,
          description: `Learn about ${lessonTitle.toLowerCase()} in this lesson.`,
          summary: `A concise overview of ${lessonTitle.toLowerCase()}.`,
          content: generateLessonContent(lessonTitle, lessonType),
          estimatedMinutes: Math.floor(Math.random() * 45) + 10,
          visibility: 'enrolled',
          status: l < 2 ? 'published' : 'draft',
          lessonType,
          allowComments: true,
          allowDownloads: true,
          isPreview: l === 0,
          isLocked: false,
        });
        totalLessons++;

        await CourseLessonVersionModel.create({
          courseId: course._id,
          lessonId: lesson._id,
          institutionId: institutionOid,
          version: 1,
          snapshot: lesson.toObject(),
        });

        if (Math.random() > 0.5) {
          const numResources = Math.floor(Math.random() * 2) + 1;

          for (let r = 0; r < numResources; r++) {
            const resourceTitle = RESOURCE_TITLES[r % RESOURCE_TITLES.length];
            const resourceType = getRandomElement([...RESOURCE_TYPES]);

            await CourseResourceModel.create({
              courseId: course._id,
              lessonId: lesson._id,
              institutionId: institutionOid,
              type: resourceType,
              title: resourceTitle,
              description: `Additional resource: ${resourceTitle}`,
              url:
                resourceType === 'external_link'
                  ? 'https://example.com/resource'
                  : null,
              orderIndex: r,
              visibility: 'enrolled',
            });
            totalResources++;
          }
        }
      }
    }

    if (totalModules % 20 === 0) {
      logger.info(
        `Progress: ${totalModules} modules, ${totalLessons} lessons, ${totalResources} resources created...`,
      );
    }
  }

  logger.info('Course builder seed completed!');
  logger.info(`Total modules created: ${totalModules}`);
  logger.info(`Total lessons created: ${totalLessons}`);
  logger.info(`Total resources created: ${totalResources}`);
}
