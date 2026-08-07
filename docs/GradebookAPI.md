# Gradebook API

Base path: `/api/v1/gradebook`

All routes require authentication and `gradebook:*` permissions (see [GradebookPermissions](./GradebookPermissions.md)).

## Entries

### `GET /gradebook/entries`

List consumed grade entries (paginated).

Query: `courseId`, `studentId`, `activityKind`, `status`, `page`, `limit`

Permission: `gradebook:read`

### `GET /gradebook/courses/:courseId/entries`

Entries for a course. Students only see their own rows.

Permission: `gradebook:read`

## Summaries

### `GET /gradebook/courses/:courseId/summaries`

Course grade summaries (weighted %, letter grade, marks totals).

Permission: `gradebook:read`

## Weight scheme

### `GET /gradebook/courses/:courseId/weight-scheme`

Returns scheme or defaults if none saved.

### `PUT /gradebook/weight-scheme`

Body:

```json
{
  "courseId": "<ObjectId>",
  "assignmentWeight": 25,
  "labWeight": 10,
  "quizWeight": 15,
  "examWeight": 30,
  "projectWeight": 20,
  "attemptPolicy": "best"
}
```

Weights must sum to 100. Triggers course sync after save.

Permission: `gradebook:write`

## Ingestion

### `POST /gradebook/ingest`

Ingest a single source record.

```json
{
  "activityKind": "assignment|lab|quiz|exam|project",
  "sourceRefId": "<ObjectId>"
}
```

Permission: `gradebook:write`

### `POST /gradebook/sync`

Sync all sources for a course.

```json
{ "courseId": "<ObjectId>" }
```

Permission: `gradebook:write`

## Project grading

### `POST /gradebook/project/grade`

Assign marks to a `ready` project submission and export to gradebook.

```json
{
  "submissionId": "<ObjectId>",
  "marksObtained": 85,
  "totalMarks": 100,
  "passingMarks": 40,
  "feedback": "Strong implementation",
  "gradingMethod": "marks"
}
```

Permission: `gradebook:write`

### `GET /gradebook/courses/:courseId/pending-projects`

Submissions awaiting gradebook export (`evaluationStatus: ready`).

Permission: `gradebook:write`

## Finalize

### `POST /gradebook/finalize`

Sync course, then mark all summaries as `finalized`.

```json
{ "courseId": "<ObjectId>" }
```

Permission: `gradebook:manage`

## Dashboards

| Route | Permission | Audience |
| --- | --- | --- |
| `GET /gradebook/dashboard/institution?courseId=` | `gradebook:manage` | Institution admin |
| `GET /gradebook/dashboard/faculty?courseId=` | `gradebook:read` | Faculty (assigned course) |
| `GET /gradebook/dashboard/student` | `gradebook:read` | Student (self) |

## Source collections

| `activityKind` | `sourceCollection` | Source module |
| --- | --- | --- |
| `assignment` | `assignment_grades` | Assignments |
| `lab` | `lab_progress` | Practice Labs |
| `quiz` | `quiz_results` | Quizzes |
| `exam` | `exam_results` | Examinations |
| `project` | `project_grades` | Projects / Gradebook |
