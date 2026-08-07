# Resources

Lesson-attached resources (Step 7.5).

## Fields

`id` · `courseId` · `lessonId` · `type` · `title` · `description` · `url` · `storageKey` · `fileName` · `mimeType` · `size` · `orderIndex` · `visibility` · timestamps · soft delete

## Types

`pdf` · `video` · `image` · `audio` · `zip` · `markdown` · `html` · `external_link` · `presentation`

## APIs (under `/api/v1/courses/:courseId/lessons/:lessonId`)

| Method | Path |
| --- | --- |
| GET/POST | `/resources` |
| PATCH/DELETE | `/resources/:resourceId` |

Upload uses storage keys under `courses/{institutionId}/{courseId}/lessons/{lessonId}/resources/…`.

## Events

`resource.uploaded` · `resource.deleted`
