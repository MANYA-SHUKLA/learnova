import { Types } from 'mongoose';
import { CourseModel } from '../models/course.model.js';
import { logger } from '../utils/logger/index.js';

const COURSE_TITLES = {
  programming: [
    'Introduction to Programming',
    'Advanced Python Programming',
    'Web Development Fundamentals',
    'Mobile App Development',
    'Object-Oriented Programming',
    'Data Structures and Algorithms',
  ],
  cyber_security: [
    'Network Security Fundamentals',
    'Ethical Hacking',
    'Cryptography Essentials',
    'Security Operations',
  ],
  ai: [
    'Machine Learning Basics',
    'Deep Learning with Neural Networks',
    'Natural Language Processing',
    'Computer Vision',
  ],
  cloud: [
    'Cloud Computing Fundamentals',
    'AWS Solutions Architect',
    'DevOps and CI/CD',
  ],
  networking: [
    'Computer Networks',
    'Network Administration',
    'Wireless Networks',
  ],
  database: [
    'Database Management Systems',
    'SQL and NoSQL Databases',
    'Database Design and Optimization',
  ],
  electronics: [
    'Digital Electronics',
    'Microprocessors and Microcontrollers',
    'Embedded Systems',
  ],
  mechanical: [
    'Thermodynamics',
    'Fluid Mechanics',
    'Machine Design',
  ],
  mathematics: [
    'Calculus I',
    'Linear Algebra',
    'Discrete Mathematics',
    'Probability and Statistics',
  ],
  general: [
    'Communication Skills',
    'Professional Ethics',
    'Project Management',
  ],
};

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
const STATUSES = ['draft', 'review', 'published', 'archived', 'scheduled'] as const;
const VISIBILITIES = ['private', 'institution', 'public', 'invite_only'] as const;

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateCourseCode(category: string, index: number): string {
  const prefix = category.substring(0, 2).toUpperCase();
  const num = String(100 + index).padStart(3, '0');
  return `${prefix}${num}`;
}

interface SeedRefs {
  campusIds: string[];
  schoolIds: string[];
  departmentIds: string[];
  programIds: string[];
  semesterIds: string[];
  facultyIds: string[];
  userId: string;
}

/**
 * Seeds 30 realistic courses across multiple departments, programs, and semesters.
 * @param institutionId The institution ID
 * @param refs References to campus, school, department, program, semester, and faculty IDs
 */
export async function seedCourses(institutionId: string, refs: SeedRefs): Promise<void> {
  const instOid = new Types.ObjectId(institutionId);
  const userOid = new Types.ObjectId(refs.userId);

  // Delete existing courses for this institution
  const deleteResult = await CourseModel.deleteMany({ institutionId: instOid });
  logger.info({ institutionId, deleted: deleteResult.deletedCount }, 'Deleted existing courses');

  const courses: Array<Record<string, unknown>> = [];
  const usedCourseCodes = new Set<string>();
  const usedSlugs = new Set<string>();

  let index = 0;
  // Generate courses for each category
  for (const [category, titles] of Object.entries(COURSE_TITLES)) {
    for (const title of titles) {
      index++;
      if (index > 30) break; // Limit to 30 courses

      // Generate unique identifiers
      let courseCode: string;
      let slug: string;

      do {
        courseCode = generateCourseCode(category, index);
        slug = `${generateSlug(title)}-${Math.floor(Math.random() * 1000)}`;
      } while (usedCourseCodes.has(courseCode) || usedSlugs.has(slug));

      usedCourseCodes.add(courseCode);
      usedSlugs.add(slug);

      const departmentId = randomItem(refs.departmentIds);
      const campusId = randomItem(refs.campusIds);
      const schoolId = randomItem(refs.schoolIds);

      // Randomly assign 1-3 programs
      const numPrograms = randomInt(1, Math.min(3, refs.programIds.length));
      const programIds = [];
      const availablePrograms = [...refs.programIds];
      for (let i = 0; i < numPrograms; i++) {
        const idx = randomInt(0, availablePrograms.length - 1);
        programIds.push(new Types.ObjectId(availablePrograms[idx]!));
        availablePrograms.splice(idx, 1);
      }

      // Randomly assign 1-2 semesters
      const numSemesters = randomInt(1, Math.min(2, refs.semesterIds.length));
      const semesterIds = [];
      const availableSemesters = [...refs.semesterIds];
      for (let i = 0; i < numSemesters; i++) {
        const idx = randomInt(0, availableSemesters.length - 1);
        semesterIds.push(new Types.ObjectId(availableSemesters[idx]!));
        availableSemesters.splice(idx, 1);
      }

      // Randomly assign 1-3 faculty
      const numFaculty = randomInt(1, Math.min(3, refs.facultyIds.length));
      const facultyIds = [];
      const availableFaculty = [...refs.facultyIds];
      for (let i = 0; i < numFaculty; i++) {
        const idx = randomInt(0, availableFaculty.length - 1);
        facultyIds.push(new Types.ObjectId(availableFaculty[idx]!));
        availableFaculty.splice(idx, 1);
      }

      const coordinatorId = randomBool(0.7) ? facultyIds[0] : null;

      const difficulty = randomItem(DIFFICULTIES);
      const credits = randomInt(3, 6);
      const estimatedHours = credits * 15;
      const status = index <= 20 ? 'published' : randomItem(STATUSES); // 70% published
      const visibility = status === 'published' ? 'institution' : randomItem(VISIBILITIES);

      const tags = [];
      if (category === 'programming') tags.push('coding', 'software', 'development');
      if (category === 'cyber_security') tags.push('security', 'hacking', 'protection');
      if (category === 'ai') tags.push('machine-learning', 'artificial-intelligence', 'data-science');
      if (category === 'cloud') tags.push('aws', 'azure', 'cloud-computing');
      if (difficulty === 'beginner') tags.push('introductory', 'basics');
      if (difficulty === 'advanced' || difficulty === 'expert') tags.push('advanced', 'professional');

      const learningObjectives = [
        `Understand the fundamentals of ${title.toLowerCase()}`,
        `Apply ${category} concepts to real-world problems`,
        `Develop practical skills in ${title.toLowerCase()}`,
      ];

      const prerequisites = [];
      if (difficulty === 'intermediate' || difficulty === 'advanced') {
        prerequisites.push('Basic understanding of computer science');
      }
      if (difficulty === 'expert') {
        prerequisites.push('Advanced programming skills');
      }

      const skills = [
        category.replace(/_/g, ' '),
        difficulty === 'beginner' ? 'foundational skills' : 'advanced skills',
        'problem solving',
      ];

      courses.push({
        courseCode,
        slug,
        title,
        subtitle: `Master ${title}`,
        description: `This comprehensive course covers ${title.toLowerCase()} with hands-on projects and real-world applications. Students will gain practical experience and industry-relevant skills in ${category.replace(/_/g, ' ')}.`,
        shortDescription: `Learn ${title.toLowerCase()} through practical exercises and projects.`,
        thumbnail: null,
        banner: null,
        icon: null,
        institutionId: instOid,
        campusId: new Types.ObjectId(campusId),
        schoolId: new Types.ObjectId(schoolId),
        departmentId: new Types.ObjectId(departmentId),
        programIds,
        semesterIds,
        facultyIds,
        coordinatorId,
        category,
        difficulty,
        language: 'en',
        credits,
        estimatedHours,
        duration: `${credits * 4} weeks`,
        status,
        visibility,
        version: 1,
        tags,
        learningObjectives,
        prerequisites,
        requirements: [
          'Access to a computer with internet connection',
          'Willingness to learn and practice',
        ],
        outcomes: [
          `Proficiency in ${title.toLowerCase()}`,
          'Ability to work on real-world projects',
          'Industry-ready skills',
        ],
        skills,
        certificateEnabled: randomBool(0.8),
        discussionEnabled: true,
        allowDownloads: randomBool(0.6),
        allowPreview: status === 'published' && randomBool(0.4),
        maxStudents: randomBool(0.3) ? randomInt(30, 100) : null,
        enrollmentMode: status === 'published' ? 'open' : 'closed',
        publishDate: status === 'published' ? new Date(Date.now() - randomInt(1, 180) * 24 * 60 * 60 * 1000) : null,
        archiveDate: status === 'archived' ? new Date() : null,
        seoTitle: title,
        seoDescription: `Learn ${title.toLowerCase()} at your own pace`,
        seoKeywords: tags,
        createdBy: userOid,
        updatedBy: userOid,
        deletedAt: null,
        createdAt: new Date(Date.now() - randomInt(30, 365) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      });
    }
    if (index > 30) break;
  }

  const insertResult = await CourseModel.insertMany(courses);
  logger.info(
    { institutionId, inserted: insertResult.length },
    `Seeded ${insertResult.length} courses`,
  );
}
