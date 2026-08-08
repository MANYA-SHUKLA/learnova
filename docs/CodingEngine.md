# Coding Assessment Engine

Independent code-execution infrastructure shared by **Practice Labs** (Step 10) and **Coding Exams** (later examinations step).

```
Assessment Core (deadlines, attempts, lifecycle)
  ↓
Coding Assessment Engine   ← Judge0, languages, evaluate, score, history
  ↓
    ├── Practice Labs (authorship, problem bank, practice UX)
    └── Coding Exams (scheduling, proctoring, attempt rules, grading policies)
```

## Hard rule

Coding Exams **must reuse this engine**. Do **not** implement a second Judge0 client, Docker runner, output normalizer, or scoring loop in the exam module.

Exam-specific code should only add:

- Exam scheduling / windows
- Proctoring & integrity
- Attempt / seating rules
- Grading policies on top of engine verdicts
- Exam-scoped storage adapter (same `CodingEngineStorage` interface)

## Location

| Layer | Path |
| --- | --- |
| Engine orchestration | `backend/src/services/coding-engine/` |
| Pure scoring | `@learnova/shared` → `coding/*` (also `@learnova/shared/coding`) |
| Language constants | `@learnova/constants` → `practice-lab` language catalog |
| Judge0 client | `coding-engine/judge0.client.ts` |

## Reusable services

| Service | Responsibility |
| --- | --- |
| `judge0Client` | Sandboxed execution (Docker via Judge0 CE) + offline mock |
| `codingLanguageService` | Language catalog, Judge0 ids, Monaco ids, boilerplates |
| `CodingEngine.run()` | Interactive run + execution history persistence |
| `CodingEngine.evaluate()` | Hidden/public test case evaluation + weighted scoring |
| `CodingEngineStorage` | Pluggable submission / history storage |
| Shared scoring | `normalizeOutput`, `outputsMatch`, `computeSubmissionScore`, `mapJudge0StatusToExecutionStatus` |

## Usage (Practice Lab)

```ts
import {
  createCodingEngine,
  createPracticeLabCodingStorage,
  labActivityRef,
  codingLanguageService,
} from '../coding-engine/index.js';

const engine = createCodingEngine(createPracticeLabCodingStorage(), emitStatus);
await engine.run({ … activity: labActivityRef(labId, problemId) }, { notifyRoom });
await engine.evaluate({ … testCases, submissionId }, { notifyRoom });
```

## Usage (Coding Exams — future)

1. Implement `createExamCodingStorage(): CodingEngineStorage` mapping to exam collections.
2. Call `createCodingEngine(examStorage, emitStatus)`.
3. Pass `activity: { kind: 'exam', activityId: examId, problemId }`.
4. Apply exam policies (time window, proctoring, max attempts) **before** calling `run` / `evaluate`.

## Activity kinds

`lab` · `exam` · `contest`

## Related

- [PracticeLab.md](./PracticeLab.md)
- [Judge0.md](./Judge0.md)
- [Execution.md](./Execution.md)
- [AssessmentCore.md](./AssessmentCore.md)
- [ADR 0005 — Code Runner](./adr/0005-code-runner.md)
