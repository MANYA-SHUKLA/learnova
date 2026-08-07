# Grade Scales

Default enterprise scale (4.0 GPA):

| Min % | Letter | Points | Result |
| --- | --- | --- | --- |
| 97 | A+ | 4.0 | pass |
| 93 | A | 4.0 | pass |
| 90 | A- | 3.7 | pass |
| 87 | B+ | 3.3 | pass |
| 83 | B | 3.0 | pass |
| 80 | B- | 2.7 | pass |
| 77 | C+ | 2.3 | pass |
| 73 | C | 2.0 | pass |
| 70 | C- | 1.7 | pass |
| 67 | D+ | 1.3 | pass |
| 63 | D | 1.0 | pass |
| 60 | D- | 0.7 | pass |
| 0 | F | 0.0 | fail |

Pass/fail threshold defaults to **60%** (`GRADEBOOK_DEFAULTS.PASSING_PERCENTAGE`).

Institutions may store a custom `scaleId` on the assessment weight scheme for future scale plugins.

Implementation: `packages/shared/src/gradebook/aggregation.ts` + `GRADE_SCALE_BANDS` in `@learnova/constants`.
