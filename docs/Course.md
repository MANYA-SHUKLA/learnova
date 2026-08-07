# Course Management

## Overview

The Course Management module enables institutions to create, organize, and deliver structured learning content. It provides a comprehensive system for managing courses, modules, lessons, and tracking student progress.

## Key Features

- **Course Creation & Management**: Create and manage courses with metadata (code, title, description, credits, status)
- **Hierarchical Structure**: Organize content into Courses → Modules → Lessons
- **Multiple Content Types**: Support for video, PDF, markdown, HTML, images, audio, links, embeds, code, downloads, presentations
- **Course Status Management**: Draft, Published, Archived states
- **Faculty Assignment**: Assign faculty members and coordinators to courses
- **Department & Program Mapping**: Link courses to departments, programs, and semesters
- **Progress Tracking**: Track student progress through courses and lessons
- **Rich Metadata**: Objectives, prerequisites, syllabus, tags, thumbnails, banners

## Course Structure

### Course
The top-level entity representing a complete course offering.

**Key Fields**:
- courseCode: Unique identifier
- title, slug, description
- departmentId, programId, semesterId
- credits: Course credit hours
- status: draft | published | archived
- facultyIds: Assigned faculty members
- coordinatorId: Course coordinator
- objectives: Learning objectives
- prerequisites: Required prior knowledge
- syllabus: Course outline
- tags: Searchable tags

### Module
A logical grouping of lessons within a course.

**Key Fields**:
- courseId: Parent course
- title, description
- order: Display sequence
- isActive: Visibility toggle

### Lesson
Individual learning unit with specific content.

**Key Fields**:
- courseId, moduleId: Parent references
- title, description
- order: Display sequence
- contentType: Type of lesson content
- contentUrl, contentText, contentMetadata
- durationMinutes: Estimated completion time
- isActive: Visibility toggle

### Progress
Tracks student engagement and completion.

**Key Fields**:
- courseId, studentId
- moduleId, lessonId: Current position
- status: not_started | in_progress | completed
- progressPercent: Completion percentage
- lastAccessedAt, completedAt
- timeSpentMinutes: Total time invested

## API Endpoints

See `CourseAPI.md` for detailed API documentation.

## Permissions

See `CoursePermissions.md` for role-based access control.

## Future Enhancements

- AI-powered content recommendations
- Adaptive learning paths
- Automated assessments and quizzes
- Interactive assignments and labs
- Certificate generation upon completion
- Course analytics and insights
- Discussion forums and collaboration
- Live sessions and webinars
