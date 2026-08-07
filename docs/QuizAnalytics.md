# Quiz Analytics

Metrics and dashboards for quiz performance — per-quiz drill-down, role dashboards, and institution-wide stats.

## Endpoints

| Method | Path | Perm | Scope |
| --- | --- | --- | --- |
| GET | `/quizzes/:id/analytics` | read | Single quiz |
| GET | `/analytics/quizzes/:id` | read | Single quiz (alias) |
| GET | `/quizzes/stats` | manage | Institution-wide |
| GET | `/quizzes/dashboard/faculty` | read | Faculty-owned / course quizzes |
| GET | `/quizzes/dashboard/student` | read | Current student's attempts |
| GET | `/quizzes/dashboard/institution` | manage | Institution admin summary |

## Per-quiz analytics

`GET /quizzes/:id/analytics` returns:

| Field | Description |
| --- | --- |
| `quizId` | Quiz identifier |
| `totalAttempts` | Submitted + completed attempts |
| `averageScore` | Mean attempt percentage (0–100) |
| `passRate` | % of results where `passed === true` |
| `averageTimeSeconds` | Mean time taken per attempt |
| `questionStats[]` | Per-question breakdown |
| `mostIncorrect[]` | Top 5 questions by incorrect rate |

### Question stat row

| Field | Description |
| --- | --- |
| `questionId` | Question ObjectId |
| `title` | Truncated question stem (80 chars) |
| `accuracy` | % correct across all answers |
| `incorrectRate` | 100 − accuracy |
| `averageTimeSeconds` | Mean time spent on this question |
| `difficulty` | Question difficulty label |

## Institution stats

`GET /quizzes/stats` (manage only):

| Field | Description |
| --- | --- |
| `total` | All non-deleted quizzes |
| `draft` / `published` / `closed` / `archived` | Count by status |
| `totalAttempts` | All attempts |
| `completedAttempts` | Submitted + completed |
| `averageScore` | Institution-wide mean percentage |
| `passRate` | Institution-wide pass rate |
| `questionBankSize` | Active question banks |
| `totalQuestions` | All questions |
| `byCourse[]` | Top 10 courses by quiz count |
| `byStatus[]` | Status distribution |
| `byType[]` | Quiz type distribution |

## Faculty dashboard

`GET /quizzes/dashboard/faculty`:

| Field | Description |
| --- | --- |
| `quizzesCreated` | Quizzes authored by current user |
| `publishedQuizzes` | Published count (owned or course-scoped) |
| `totalAttempts` | Attempts on scoped quizzes |
| `averageScore` | Mean score on scoped quizzes |
| `completionRate` | Published / total scoped quizzes (%) |
| `mostMissedQuestions` | Reserved for future enrichment |

Scoped to quizzes the faculty member created or belongs to assigned courses.

## Student dashboard

`GET /quizzes/dashboard/student`:

| Field | Description |
| --- | --- |
| `upcomingQuizzes` | Published quizzes with future close date (enrolled courses) |
| `completedQuizzes` | Student's completed attempts |
| `pendingQuizzes` | Published minus completed (enrolled) |
| `averageScore` | Student's mean attempt percentage |
| `recentAttempts[]` | Last 5 attempts |

## Institution dashboard

`GET /quizzes/dashboard/institution` (manage only):

| Field | Description |
| --- | --- |
| `totalQuizzes` | All quizzes |
| `questionBankSize` | Active banks |
| `totalAttempts` | All attempts |
| `averageScore` | Institution mean |
| `passRate` | Institution pass rate |
| `departmentComparison[]` | Reserved for future enrichment |

## Data sources

Analytics aggregate from:

- `QuizAttempt` — score, percentage, time taken, status
- `QuizResult` — passed, correct/incorrect/skipped, rank
- `QuizAnswer` — per-question correctness, time spent
- `Question` — stem, difficulty for labeling

Only attempts with status `submitted` or `completed` count toward score averages.

## Related docs

- [QuizManagement.md](./QuizManagement.md)
- [QuizAPI.md](./QuizAPI.md)
- [QuizPermissions.md](./QuizPermissions.md)
