/**
 * OpenAPI 3.0 document for Learnova API v1.
 * Served at /docs (Swagger UI) and /openapi.json.
 */

type Json = Record<string, unknown>;

const bearer = [{ bearerAuth: [] }];

function jsonBody(schema: Json): Json {
  return {
    required: true,
    content: { 'application/json': { schema } },
  };
}

function ok(description: string): Json {
  return {
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            requestId: { type: 'string', format: 'uuid' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  };
}

const errorResponses: Json = {
  '400': { description: 'Validation error' },
  '401': { description: 'Unauthorized — missing or invalid bearer token' },
  '403': { description: 'Forbidden — insufficient permission' },
  '404': { description: 'Not found' },
  '429': { description: 'Rate limited' },
  '500': { description: 'Internal server error' },
};

function op(
  summary: string,
  opts: {
    tags: string[];
    security?: boolean;
    parameters?: Json[];
    requestBody?: Json;
    description?: string;
  },
): Json {
  return {
    summary,
    description: opts.description,
    tags: opts.tags,
    security: opts.security === false ? [] : bearer,
    parameters: opts.parameters,
    requestBody: opts.requestBody,
    responses: {
      '200': ok(summary),
      ...errorResponses,
    },
  };
}

const objectIdParam = (name: string, description?: string): Json => ({
  name,
  in: 'path',
  required: true,
  schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
  description: description ?? 'MongoDB ObjectId',
});

const pageParams: Json[] = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
  { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search query' },
  { name: 'sortBy', in: 'query', schema: { type: 'string' } },
  { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
];

function crudCollection(tag: string, base: string, idName = 'id'): Json {
  const singular = tag.endsWith('s') ? tag.slice(0, -1) : tag;
  return {
    [base]: {
      get: op(`List ${tag}`, { tags: [tag], parameters: pageParams }),
      post: op(`Create ${singular}`, {
        tags: [tag],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    [`${base}/{${idName}}`]: {
      get: op(`Get ${singular} by id`, {
        tags: [tag],
        parameters: [objectIdParam(idName)],
      }),
      put: op(`Replace ${singular}`, {
        tags: [tag],
        parameters: [objectIdParam(idName)],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
      patch: op(`Update ${singular}`, {
        tags: [tag],
        parameters: [objectIdParam(idName)],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
      delete: op(`Archive/delete ${singular}`, {
        tags: [tag],
        parameters: [objectIdParam(idName)],
      }),
    },
  };
}

export const openApiDocument: Json = {
  openapi: '3.0.3',
  info: {
    title: 'Learnova API',
    version: '0.1.0',
    description: [
      'Enterprise AI learning platform API (v1).',
      '',
      '**Architecture layers**',
      '- Step 7 — Course catalog (metadata / publishing)',
      '- Step 7.5 — Course builder (modules / lessons / resources)',
      '- Step 8 — Enrollments (student ↔ course)',
      '- Step 8.5 — Progress tracking (learning state only — not grades)',
      '',
      'Authenticate with `Authorization: Bearer <accessToken>` from `POST /api/v1/auth/login`.',
    ].join('\n'),
    contact: { name: 'Manya Shukla', email: 'shuklamanya99@gmail.com' },
  },
  servers: [
    { url: 'http://localhost:4000', description: 'Local development' },
    { url: '/', description: 'Current host' },
  ],
  tags: [
    { name: 'Health', description: 'Liveness / readiness' },
    { name: 'Auth', description: 'Login, sessions, password' },
    { name: 'Institution', description: 'Tenant + academic hierarchy' },
    { name: 'Faculty', description: 'Faculty directory' },
    { name: 'Students', description: 'Student directory' },
    { name: 'Courses', description: 'Course catalog (Step 7)' },
    { name: 'Course Builder', description: 'Modules / lessons / resources (Step 7.5)' },
    { name: 'Enrollments', description: 'Enrollment management (Step 8)' },
    { name: 'Progress', description: 'Learning progress tracking (Step 8.5)' },
    { name: 'Assignments', description: 'Assignments, submissions, rubrics and grading' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token from POST /api/v1/auth/login',
      },
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'faculty.demo@learnova.test' },
          password: { type: 'string', format: 'password', example: 'Demo@12345' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: op('Root health probe', { tags: ['Health'], security: false }),
    },
    '/api/v1/health': {
      get: op('API health (Mongo, Redis, mail, storage)', {
        tags: ['Health'],
        security: false,
      }),
    },
    '/api/v1/live': {
      get: op('Liveness', { tags: ['Health'], security: false }),
    },
    '/api/v1/ready': {
      get: op('Readiness', { tags: ['Health'], security: false }),
    },
    '/api/v1/version': {
      get: op('Build version', { tags: ['Health'], security: false }),
    },

    '/api/v1/auth/register': {
      post: op('Register institution + admin', {
        tags: ['Auth'],
        security: false,
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/auth/login': {
      post: op('Login', {
        tags: ['Auth'],
        security: false,
        requestBody: jsonBody({ $ref: '#/components/schemas/LoginRequest' }),
      }),
    },
    '/api/v1/auth/logout': {
      post: op('Logout current session', { tags: ['Auth'] }),
    },
    '/api/v1/auth/logout-all': {
      post: op('Logout all sessions', { tags: ['Auth'] }),
    },
    '/api/v1/auth/refresh': {
      post: op('Refresh access token (cookie + optional bearer)', {
        tags: ['Auth'],
        security: false,
      }),
    },
    '/api/v1/auth/forgot-password': {
      post: op('Request password reset', {
        tags: ['Auth'],
        security: false,
        requestBody: jsonBody({
          type: 'object',
          required: ['email'],
          properties: { email: { type: 'string', format: 'email' } },
        }),
      }),
    },
    '/api/v1/auth/reset-password': {
      post: op('Complete password reset', {
        tags: ['Auth'],
        security: false,
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/auth/change-password': {
      post: op('Change password', {
        tags: ['Auth'],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/auth/verify-email': {
      post: op('Verify email', {
        tags: ['Auth'],
        security: false,
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/auth/resend-verification': {
      post: op('Resend verification email', {
        tags: ['Auth'],
        security: false,
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/auth/me': {
      get: op('Current user profile', { tags: ['Auth'] }),
    },
    '/api/v1/auth/session': {
      get: op('Current session', { tags: ['Auth'] }),
    },
    '/api/v1/auth/sessions': {
      get: op('List sessions', { tags: ['Auth'] }),
    },
    '/api/v1/auth/sessions/{sessionId}': {
      delete: op('Revoke session', {
        tags: ['Auth'],
        parameters: [
          { name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } },
        ],
      }),
    },

    '/api/v1/institutions/me': {
      get: op('My institution', { tags: ['Institution'] }),
    },
    ...crudCollection('Institution', '/api/v1/institutions'),
    ...crudCollection('Campuses', '/api/v1/campuses'),
    ...crudCollection('Schools', '/api/v1/schools'),
    ...crudCollection('Departments', '/api/v1/departments'),
    ...crudCollection('Programs', '/api/v1/programs'),
    ...crudCollection('Academic Years', '/api/v1/academic-years'),
    ...crudCollection('Semesters', '/api/v1/semesters'),
    ...crudCollection('Sections', '/api/v1/sections'),
    ...crudCollection('Batches', '/api/v1/batches'),
    ...crudCollection('Academic Calendars', '/api/v1/academic-calendars'),
    '/api/v1/institution-settings': {
      get: op('Get institution settings', { tags: ['Institution'] }),
      put: op('Replace institution settings', {
        tags: ['Institution'],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
      patch: op('Patch institution settings', {
        tags: ['Institution'],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },

    ...crudCollection('Faculty', '/api/v1/faculty'),
    '/api/v1/faculty/stats': { get: op('Faculty stats', { tags: ['Faculty'] }) },
    '/api/v1/faculty/search': {
      get: op('Search faculty', { tags: ['Faculty'], parameters: pageParams }),
    },
    '/api/v1/faculty/me': {
      get: op('Own faculty profile', { tags: ['Faculty'] }),
      patch: op('Update own faculty profile', {
        tags: ['Faculty'],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/faculty/export': {
      get: op('Export faculty', { tags: ['Faculty'], parameters: pageParams }),
    },
    '/api/v1/faculty/import': {
      post: op('Import faculty', {
        tags: ['Faculty'],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/faculty/import/preview': {
      post: op('Preview faculty import', {
        tags: ['Faculty'],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },

    ...crudCollection('Students', '/api/v1/students'),
    '/api/v1/students/stats': { get: op('Student stats', { tags: ['Students'] }) },
    '/api/v1/students/search': {
      get: op('Search students', { tags: ['Students'], parameters: pageParams }),
    },
    '/api/v1/students/me': {
      get: op('Own student profile', { tags: ['Students'] }),
      patch: op('Update own student profile', {
        tags: ['Students'],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/students/export': {
      get: op('Export students', { tags: ['Students'], parameters: pageParams }),
    },
    '/api/v1/students/import': {
      post: op('Import students', {
        tags: ['Students'],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },

    ...crudCollection('Courses', '/api/v1/courses'),
    '/api/v1/courses/stats': { get: op('Course catalog stats', { tags: ['Courses'] }) },
    '/api/v1/courses/search': {
      get: op('Search courses', { tags: ['Courses'], parameters: pageParams }),
    },
    '/api/v1/courses/export': {
      get: op('Export courses', { tags: ['Courses'], parameters: pageParams }),
    },
    '/api/v1/courses/{id}/publish': {
      post: op('Publish course', { tags: ['Courses'], parameters: [objectIdParam('id')] }),
    },
    '/api/v1/courses/{id}/unpublish': {
      post: op('Unpublish course', { tags: ['Courses'], parameters: [objectIdParam('id')] }),
    },
    '/api/v1/courses/{id}/duplicate': {
      post: op('Duplicate course', { tags: ['Courses'], parameters: [objectIdParam('id')] }),
    },
    '/api/v1/courses/{id}/restore': {
      post: op('Restore archived course', {
        tags: ['Courses'],
        parameters: [objectIdParam('id')],
      }),
    },

    '/api/v1/courses/{courseId}/builder': {
      get: op('Get course builder tree', {
        tags: ['Course Builder'],
        parameters: [objectIdParam('courseId')],
      }),
    },
    '/api/v1/courses/{courseId}/modules': {
      get: op('List modules', {
        tags: ['Course Builder'],
        parameters: [objectIdParam('courseId')],
      }),
      post: op('Create module', {
        tags: ['Course Builder'],
        parameters: [objectIdParam('courseId')],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/courses/{courseId}/modules/{moduleId}': {
      get: op('Get module', {
        tags: ['Course Builder'],
        parameters: [objectIdParam('courseId'), objectIdParam('moduleId')],
      }),
      patch: op('Update module', {
        tags: ['Course Builder'],
        parameters: [objectIdParam('courseId'), objectIdParam('moduleId')],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
      delete: op('Delete module', {
        tags: ['Course Builder'],
        parameters: [objectIdParam('courseId'), objectIdParam('moduleId')],
      }),
    },
    '/api/v1/courses/{courseId}/modules/{moduleId}/lessons': {
      get: op('List lessons', {
        tags: ['Course Builder'],
        parameters: [objectIdParam('courseId'), objectIdParam('moduleId')],
      }),
      post: op('Create lesson', {
        tags: ['Course Builder'],
        parameters: [objectIdParam('courseId'), objectIdParam('moduleId')],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/courses/{courseId}/lessons/{lessonId}': {
      get: op('Get lesson', {
        tags: ['Course Builder'],
        parameters: [objectIdParam('courseId'), objectIdParam('lessonId')],
      }),
      patch: op('Update lesson', {
        tags: ['Course Builder'],
        parameters: [objectIdParam('courseId'), objectIdParam('lessonId')],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
      delete: op('Delete lesson', {
        tags: ['Course Builder'],
        parameters: [objectIdParam('courseId'), objectIdParam('lessonId')],
      }),
    },
    '/api/v1/courses/{courseId}/lessons/{lessonId}/resources': {
      get: op('List resources', {
        tags: ['Course Builder'],
        parameters: [objectIdParam('courseId'), objectIdParam('lessonId')],
      }),
      post: op('Add resource', {
        tags: ['Course Builder'],
        parameters: [objectIdParam('courseId'), objectIdParam('lessonId')],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/courses/{courseId}/resources/{resourceId}': {
      patch: op('Update resource', {
        tags: ['Course Builder'],
        parameters: [objectIdParam('courseId'), objectIdParam('resourceId')],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
      delete: op('Delete resource', {
        tags: ['Course Builder'],
        parameters: [objectIdParam('courseId'), objectIdParam('resourceId')],
      }),
    },

    ...crudCollection('Enrollments', '/api/v1/enrollments'),
    '/api/v1/enrollments/stats': { get: op('Enrollment stats', { tags: ['Enrollments'] }) },
    '/api/v1/enrollments/search': {
      get: op('Search enrollments', { tags: ['Enrollments'], parameters: pageParams }),
    },
    '/api/v1/enrollments/me': {
      get: op('My enrollments (student)', { tags: ['Enrollments'], parameters: pageParams }),
    },
    '/api/v1/enrollments/waitlist': {
      get: op('List waitlist', { tags: ['Enrollments'] }),
    },
    '/api/v1/enrollments/self': {
      post: op('Self-enroll', {
        tags: ['Enrollments'],
        requestBody: jsonBody({
          type: 'object',
          required: ['courseId'],
          properties: { courseId: { type: 'string' } },
        }),
      }),
    },
    '/api/v1/enrollments/{id}/approve': {
      post: op('Approve enrollment', {
        tags: ['Enrollments'],
        parameters: [objectIdParam('id')],
      }),
    },
    '/api/v1/enrollments/{id}/reject': {
      post: op('Reject enrollment', {
        tags: ['Enrollments'],
        parameters: [objectIdParam('id')],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/enrollments/{id}/withdraw': {
      post: op('Withdraw enrollment', {
        tags: ['Enrollments'],
        parameters: [objectIdParam('id')],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/enrollments/{id}/complete': {
      post: op('Mark enrollment completed', {
        tags: ['Enrollments'],
        parameters: [objectIdParam('id')],
      }),
    },
    '/api/v1/enrollments/{id}/restore': {
      post: op('Restore enrollment', {
        tags: ['Enrollments'],
        parameters: [objectIdParam('id')],
      }),
    },

    '/api/v1/progress/me': {
      get: op('My course progress list', {
        tags: ['Progress'],
        parameters: pageParams,
        description: 'Student learning state across enrolled courses (not grades).',
      }),
    },
    '/api/v1/progress/course/{courseId}': {
      get: op('Course progress detail (modules/lessons)', {
        tags: ['Progress'],
        parameters: [objectIdParam('courseId')],
      }),
    },
    '/api/v1/progress/resume/{courseId}': {
      get: op('Resume learning position', {
        tags: ['Progress'],
        parameters: [objectIdParam('courseId')],
      }),
    },
    '/api/v1/progress/lessons/open': {
      post: op('Open lesson (start/track visit)', {
        tags: ['Progress'],
        requestBody: jsonBody({
          type: 'object',
          required: ['courseId', 'moduleId', 'lessonId'],
          properties: {
            courseId: { type: 'string' },
            moduleId: { type: 'string' },
            lessonId: { type: 'string' },
            position: { type: 'number' },
          },
        }),
      }),
    },
    '/api/v1/progress/lessons/complete': {
      post: op('Complete lesson (triggers module/course rollup)', {
        tags: ['Progress'],
        requestBody: jsonBody({
          type: 'object',
          required: ['courseId', 'moduleId', 'lessonId'],
          properties: {
            courseId: { type: 'string' },
            moduleId: { type: 'string' },
            lessonId: { type: 'string' },
            watchPercentage: { type: 'number' },
            readingPercentage: { type: 'number' },
          },
        }),
      }),
    },
    '/api/v1/progress/lessons': {
      patch: op('Update lesson progress (watch/read/time/resume)', {
        tags: ['Progress'],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/progress/resources': {
      post: op('Update resource progress (viewed/downloaded)', {
        tags: ['Progress'],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/progress/sessions/start': {
      post: op('Start learning session', {
        tags: ['Progress'],
        requestBody: jsonBody({
          type: 'object',
          required: ['courseId'],
          properties: {
            courseId: { type: 'string' },
            lessonId: { type: 'string' },
          },
        }),
      }),
    },
    '/api/v1/progress/sessions/end': {
      post: op('End learning session (idle/active time)', {
        tags: ['Progress'],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/progress/bookmarks': {
      get: op('List bookmarks', { tags: ['Progress'], parameters: pageParams }),
      post: op('Create bookmark', {
        tags: ['Progress'],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
    },
    '/api/v1/progress/bookmarks/{id}': {
      delete: op('Delete bookmark', {
        tags: ['Progress'],
        parameters: [objectIdParam('id')],
      }),
    },
    '/api/v1/progress/notes': {
      get: op('List notes', { tags: ['Progress'], parameters: pageParams }),
      post: op('Create note', {
        tags: ['Progress'],
        requestBody: jsonBody({
          type: 'object',
          required: ['courseId', 'lessonId', 'text'],
          properties: {
            courseId: { type: 'string' },
            lessonId: { type: 'string' },
            text: { type: 'string' },
          },
        }),
      }),
    },
    '/api/v1/progress/notes/{id}': {
      patch: op('Update note', {
        tags: ['Progress'],
        parameters: [objectIdParam('id')],
        requestBody: jsonBody({
          type: 'object',
          required: ['text'],
          properties: { text: { type: 'string' } },
        }),
      }),
      delete: op('Delete note', {
        tags: ['Progress'],
        parameters: [objectIdParam('id')],
      }),
    },
    '/api/v1/progress/notes/export': {
      get: op('Export notes', { tags: ['Progress'] }),
    },
    '/api/v1/progress/activity': {
      get: op('Activity timeline', { tags: ['Progress'], parameters: pageParams }),
    },
    '/api/v1/progress/dashboard/student': {
      get: op('Student progress dashboard', { tags: ['Progress'] }),
    },
    '/api/v1/progress/dashboard/faculty': {
      get: op('Faculty course progress analytics', {
        tags: ['Progress'],
        parameters: [
          {
            name: 'courseId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
      }),
    },
    '/api/v1/progress/dashboard/institution': {
      get: op('Institution progress analytics', { tags: ['Progress'] }),
    },
    '/api/v1/progress/stats': {
      get: op('Progress stats', { tags: ['Progress'] }),
    },
    '/api/v1/progress/search': {
      get: op('Search progress / bookmarks / notes', {
        tags: ['Progress'],
        parameters: pageParams,
      }),
    },

    '/api/v1/assignments': {
      get: op('List assignments', {
        tags: ['Assignments'],
        parameters: [
          ...pageParams,
          { name: 'courseId', in: 'query', schema: { type: 'string' } },
          { name: 'moduleId', in: 'query', schema: { type: 'string' } },
          { name: 'lessonId', in: 'query', schema: { type: 'string' } },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['draft', 'published', 'archived', 'closed'] },
          },
          {
            name: 'due',
            in: 'query',
            schema: { type: 'string', enum: ['upcoming', 'overdue', 'none'] },
          },
        ],
        description:
          'Scoped by role: admins see all, faculty see own plus non-draft course assignments, students see published assignments for enrolled courses.',
      }),
      post: op('Create assignment (draft)', {
        tags: ['Assignments'],
        requestBody: jsonBody({
          type: 'object',
          required: ['courseId', 'title'],
          properties: {
            courseId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            instructions: { type: 'string', nullable: true },
            assignmentType: { type: 'string', default: 'homework' },
            totalMarks: { type: 'number', default: 100 },
            passingMarks: { type: 'number', default: 40 },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            closeDate: { type: 'string', format: 'date-time', nullable: true },
            rubricId: { type: 'string', nullable: true },
          },
        }),
      }),
    },
    '/api/v1/assignments/search': {
      get: op('Search assignments', { tags: ['Assignments'], parameters: pageParams }),
    },
    '/api/v1/assignments/stats': {
      get: op('Assignment stats (institution)', { tags: ['Assignments'] }),
    },
    '/api/v1/assignments/audit': {
      get: op('Assignment audit log', { tags: ['Assignments'] }),
    },
    '/api/v1/assignments/dashboard/faculty': {
      get: op('Faculty assignment dashboard', {
        tags: ['Assignments'],
        description: 'Assignments created, pending reviews, late submissions, average grade.',
      }),
    },
    '/api/v1/assignments/dashboard/student': {
      get: op('Student assignment dashboard', {
        tags: ['Assignments'],
        description: 'Upcoming, submitted, pending, late and graded counts.',
      }),
    },
    '/api/v1/assignments/dashboard/institution': {
      get: op('Institution assignment analytics', { tags: ['Assignments'] }),
    },
    '/api/v1/assignments/export': {
      get: op('Export assignments (JSON or CSV)', {
        tags: ['Assignments'],
        parameters: [
          { name: 'courseId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          {
            name: 'format',
            in: 'query',
            schema: { type: 'string', enum: ['json', 'csv'], default: 'json' },
          },
        ],
      }),
    },
    '/api/v1/assignments/import': {
      post: op('Import assignments', {
        tags: ['Assignments'],
        requestBody: jsonBody({
          type: 'object',
          required: ['rows'],
          properties: {
            rows: { type: 'array', items: { type: 'object', additionalProperties: true } },
            publish: { type: 'boolean', default: false },
          },
        }),
      }),
    },
    '/api/v1/assignments/me': {
      get: op('My published assignments (student)', {
        tags: ['Assignments'],
        parameters: pageParams,
      }),
    },
    '/api/v1/assignments/rubrics': {
      get: op('List rubrics', { tags: ['Assignments'], parameters: pageParams }),
      post: op('Create rubric', {
        tags: ['Assignments'],
        requestBody: jsonBody({
          type: 'object',
          required: ['title', 'criteria'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            reusable: { type: 'boolean', default: true },
            criteria: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['title', 'maxPoints'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  weight: { type: 'number', default: 0 },
                  maxPoints: { type: 'number' },
                },
              },
            },
          },
        }),
      }),
    },
    '/api/v1/assignments/rubrics/{id}': {
      get: op('Get rubric by id', {
        tags: ['Assignments'],
        parameters: [objectIdParam('id')],
      }),
      patch: op('Update rubric', {
        tags: ['Assignments'],
        parameters: [objectIdParam('id')],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
      delete: op('Delete rubric', {
        tags: ['Assignments'],
        parameters: [objectIdParam('id')],
      }),
    },
    '/api/v1/assignments/submissions': {
      get: op('List submissions', {
        tags: ['Assignments'],
        parameters: [
          ...pageParams,
          { name: 'assignmentId', in: 'query', schema: { type: 'string' } },
          { name: 'studentId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'late', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'graded', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
        ],
      }),
    },
    '/api/v1/assignments/submissions/draft': {
      post: op('Save submission draft (student)', {
        tags: ['Assignments'],
        requestBody: jsonBody({
          type: 'object',
          required: ['assignmentId'],
          properties: {
            assignmentId: { type: 'string' },
            submissionType: { type: 'string', default: 'mixed' },
            textSubmission: { type: 'string', nullable: true },
            links: { type: 'array', items: { type: 'string', format: 'uri' } },
          },
        }),
      }),
    },
    '/api/v1/assignments/submissions/submit': {
      post: op('Submit assignment (student)', {
        tags: ['Assignments'],
        description:
          'Enforces dueDate / closeDate, the late-submission flag, maxAttempts and resubmission rules.',
        requestBody: jsonBody({
          type: 'object',
          required: ['assignmentId'],
          properties: {
            assignmentId: { type: 'string' },
            submissionType: { type: 'string', default: 'mixed' },
            textSubmission: { type: 'string', nullable: true },
            links: { type: 'array', items: { type: 'string', format: 'uri' } },
          },
        }),
      }),
    },
    '/api/v1/assignments/submissions/{id}': {
      get: op('Get submission by id', {
        tags: ['Assignments'],
        parameters: [objectIdParam('id')],
      }),
    },
    '/api/v1/assignments/submissions/{id}/grade': {
      post: op('Grade submission', {
        tags: ['Assignments'],
        parameters: [objectIdParam('id')],
        requestBody: jsonBody({
          type: 'object',
          properties: {
            gradingMethod: {
              type: 'string',
              enum: ['manual', 'rubric', 'pass_fail', 'marks', 'percentage'],
              default: 'marks',
            },
            marksObtained: { type: 'number', nullable: true },
            percentage: { type: 'number', nullable: true },
            passed: { type: 'boolean', nullable: true },
            feedback: { type: 'string', nullable: true },
            rubricScores: { type: 'array', items: { type: 'object', additionalProperties: true } },
            returnToStudent: { type: 'boolean', default: false },
          },
        }),
      }),
    },
    '/api/v1/assignments/submissions/{id}/files': {
      post: op('Upload submission file (base64)', {
        tags: ['Assignments'],
        parameters: [objectIdParam('id')],
        requestBody: jsonBody({
          type: 'object',
          required: ['fileName', 'contentType', 'data'],
          properties: {
            fileName: { type: 'string' },
            contentType: { type: 'string' },
            data: { type: 'string', description: 'Base64-encoded file, max 50MB decoded' },
          },
        }),
      }),
    },
    '/api/v1/assignments/{id}': {
      get: op('Get assignment by id', {
        tags: ['Assignments'],
        parameters: [objectIdParam('id')],
      }),
      patch: op('Update assignment', {
        tags: ['Assignments'],
        parameters: [objectIdParam('id')],
        requestBody: jsonBody({ type: 'object', additionalProperties: true }),
      }),
      delete: op('Soft-delete assignment', {
        tags: ['Assignments'],
        parameters: [objectIdParam('id')],
      }),
    },
    '/api/v1/assignments/{id}/publish': {
      post: op('Publish assignment', {
        tags: ['Assignments'],
        parameters: [objectIdParam('id')],
      }),
    },
    '/api/v1/assignments/{id}/archive': {
      post: op('Archive assignment', {
        tags: ['Assignments'],
        parameters: [objectIdParam('id')],
      }),
    },
    '/api/v1/assignments/{id}/close': {
      post: op('Close assignment for submissions', {
        tags: ['Assignments'],
        parameters: [objectIdParam('id')],
      }),
    },
    '/api/v1/assignments/{id}/attachments': {
      post: op('Upload assignment attachment (base64)', {
        tags: ['Assignments'],
        parameters: [objectIdParam('id')],
        requestBody: jsonBody({
          type: 'object',
          required: ['fileName', 'contentType', 'data'],
          properties: {
            fileName: { type: 'string' },
            contentType: { type: 'string' },
            data: { type: 'string', description: 'Base64-encoded file, max 50MB decoded' },
          },
        }),
      }),
    },
    '/api/v1/assignments/{id}/comments': {
      get: op('List assignment comments', {
        tags: ['Assignments'],
        parameters: [
          objectIdParam('id'),
          { name: 'submissionId', in: 'query', schema: { type: 'string' } },
        ],
      }),
      post: op('Add assignment comment / feedback', {
        tags: ['Assignments'],
        parameters: [objectIdParam('id')],
        requestBody: jsonBody({
          type: 'object',
          required: ['body'],
          properties: {
            body: { type: 'string' },
            submissionId: { type: 'string', nullable: true },
            parentCommentId: { type: 'string', nullable: true },
          },
        }),
      }),
    },
  },
};
