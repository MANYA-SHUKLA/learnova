# Lab Leaderboard

Rank learners by practice performance.

## Scopes

`global` · `course` · `department` · `faculty` · `lab` · `problem`

## Metrics

| Field | Meaning |
| --- | --- |
| rank | 1-based position |
| solvedCount | Distinct accepted problems (or accepts for problem scope) |
| attempts | Total submissions considered |
| accuracy | Success rate % |
| totalTimeMS | Aggregate execution / time spent |
| score | Ranking score (solved count in v1) |

## API

`GET /api/v1/practice-labs/leaderboard`

Query: `scope`, `practiceLabId`, `problemId`, `courseId`, `page`, `limit`

Requires `lab:read`. Lab scope requires `practiceLabId`.
