# Certificate Eligibility Engine

The **Certificate Eligibility Engine** decides whether a student may receive a certificate or transcript. It is a **read-only gate** in front of document generation — not an assessment or grading system.

## Purpose

```
Published Gradebook + Institution Policy (already applied) + Standing + Completion rules
        ↓
              Eligibility Engine (boolean check only)
        ↓
              Certificate / Transcript issuance
```

## Allowed inputs

| Source | What is read | What is never done |
|--------|----------------|---------------------|
| **Published gradebook** | `CourseGradeSummary.published`, `result`, snapshot metadata | Recompute percentage, letter grade, or pass/fail |
| **Gradebook entries** | Activity rows (`passed`, `status`, `activityKind`) for lab/project/quiz/exam certs | Re-score assessments |
| **Institutional policy** | Outcomes already stored by gradebook (`result`, standing thresholds applied upstream) | Call `evaluatePassFail`, GPA formulas, or relative grading |
| **Academic standing** | `AcademicStanding.standing` from gradebook | Call `computeAcademicStanding` |
| **Completion requirements** | Enrollment counts, published course coverage | Infer grades from enrollments alone |

## Forbidden operations

The certificate module **must never**:

- Calculate marks, percentages, or letter grades
- Compute semester GPA, CGPA, or academic standing
- Apply grade replacement, moderation, or weighting logic
- Read raw assignment / quiz / exam scores to derive new grades

GPA and standing on transcripts are **copied** from `SemesterGrade`, `CGPARecord`, and `AcademicStanding` at issuance time — they are not calculated in the certificate layer.

## Implementation map

| Layer | Location | Role |
|-------|----------|------|
| Pure rules | `packages/shared/src/certificate/eligibility.ts` | Stateless eligibility predicates |
| Data loading | `apps/backend/src/services/certificate/certificate-eligibility.service.ts` | Loads gradebook/enrollment rows, calls pure rules |
| Issuance | `certificate.service.ts` | Builds documents from eligible facts only |

## Eligibility by document type

| Type | Primary checks |
|------|----------------|
| Course completion | Published summary, `result: pass`, course `certificateEnabled` |
| Lab / project / quiz / exam | Published course summary + matching gradebook entry |
| Semester completion | All enrolled courses have published grades; no failed courses |
| Program / graduation | All program enrollments have published passing grades; graduation also requires allowed standing |
| Merit / honors / distinction | Standing value from gradebook matches certificate type |
| Participation / custom | Published gradebook record exists |
| Transcript | At least one published grade row |

## Graduation standing

Graduation certificates accept standings already computed by gradebook under institution policy:

- `good_standing`
- `honors`
- `distinction`

Configured in `@learnova/constants` as `CERTIFICATE_GRADUATION_STANDINGS`. The engine compares stored standing strings — it does not evaluate GPA thresholds itself.

## Architecture rule

```
Assessments → Gradebook (official grades, GPA, standing) → Certificates (documents only)
```

Keeping eligibility read-only prevents duplicated academic logic and preserves a single source of truth in the gradebook.

## Related docs

- [Certificates](./Certificates.md)
- [GradebookPolicies](./GradebookPolicies.md)
- [AcademicRecords](./AcademicRecords.md)
