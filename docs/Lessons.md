# Lessons

Course lessons nested under modules (Step 7.5).

## Fields

`id` · `courseId` · `moduleId` · `title` · `slug` · `lessonNumber` · `orderIndex` · `description` · `summary` · `content` · `estimatedMinutes` · `visibility` · `status` · `lessonType` · `allowComments` · `allowDownloads` · `isPreview` · `isLocked` · `unlockAfterLessonId` · audit · soft delete

## Lesson types

`video` · `pdf` · `markdown` · `rich_text` · `html` · `external_link` · `code_snippet` · `image` · `audio` · `presentation` · `download`

## Status / visibility

Status: `draft` · `published` · `hidden` · `archived`  

Visibility: `private` · `enrolled` · `public` · `preview`

## APIs (under `/api/v1/courses/:courseId`)

| Method | Path |
| --- | --- |
| GET/POST | `/lessons` |
| GET/PATCH/DELETE | `/lessons/:lessonId` |
| POST | `/lessons/:lessonId/restore` · `/duplicate` · `/archive` · `/move` |
| GET | `/lessons/:lessonId/versions` |

Autosave updates lesson content and writes a version snapshot (view-only; restore later).

## Events

`lesson.created` · `lesson.updated` · `lesson.deleted` · `builder.saved`
