# Course API Reference

## Base URL
All course endpoints are prefixed with `/api/v1/courses`

## Endpoints

### List Courses
`GET /courses`

Query parameters:
- `q`: Search query (title, code, description)
- `status`: Filter by status (draft|published|archived)
- `departmentId`: Filter by department
- `programId`: Filter by program
- `semesterId`: Filter by semester
- `facultyId`: Filter by assigned faculty
- `tags`: Filter by tags
- `includeArchived`: Include archived courses (boolean)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Sort field
- `sortOrder`: asc | desc

**Permissions**: `course:read`

### Get Course
`GET /courses/:id`

**Permissions**: `course:read`

### Get Course Stats
`GET /courses/stats`

Returns aggregated statistics:
- total, published, draft, archived counts
- byDepartment breakdown

**Permissions**: `course:read`

### Create Course
`POST /courses`

Request body:
```json
{
  "courseCode": "CS101",
  "title": "Introduction to Computer Science",
  "slug": "intro-cs",
  "description": "Foundational course...",
  "departmentId": "uuid",
  "programId": "uuid",
  "semesterId": "uuid",
  "credits": 3,
  "status": "draft",
  "facultyIds": ["uuid1", "uuid2"],
  "coordinatorId": "uuid",
  "objectives": ["Learn programming basics", "..."],
  "prerequisites": ["None"],
  "tags": ["programming", "basics"]
}
```

**Permissions**: `course:manage`

### Update Course
`PATCH /courses/:id`

Request body: Partial course object

**Permissions**: `course:write`

### Delete Course
`DELETE /courses/:id`

Soft-deletes the course (sets deletedAt timestamp)

**Permissions**: `course:manage`

### Publish Course
`POST /courses/:id/publish`

Changes status to 'published' and sets publishedAt timestamp

**Permissions**: `course:manage`

### Archive Course
`POST /courses/:id/archive`

Changes status to 'archived' and sets archivedAt timestamp

**Permissions**: `course:manage`

## Module Endpoints

(To be implemented)

- `GET /courses/:courseId/modules`
- `POST /courses/:courseId/modules`
- `PATCH /courses/:courseId/modules/:moduleId`
- `DELETE /courses/:courseId/modules/:moduleId`

## Lesson Endpoints

(To be implemented)

- `GET /courses/:courseId/modules/:moduleId/lessons`
- `POST /courses/:courseId/modules/:moduleId/lessons`
- `PATCH /courses/:courseId/modules/:moduleId/lessons/:lessonId`
- `DELETE /courses/:courseId/modules/:moduleId/lessons/:lessonId`

## Progress Endpoints

(To be implemented)

- `GET /courses/:courseId/progress` (for students)
- `PATCH /courses/:courseId/progress` (update progress)
- `GET /courses/:courseId/progress/students` (for faculty/admin)
