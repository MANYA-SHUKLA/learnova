# Course Dashboard

Institution course directory at `/institution/courses`.

## Statistics widgets

| Widget | Source |
| --- | --- |
| Total Courses | `CourseStats.total` |
| Published | `CourseStats.published` |
| Draft | `CourseStats.draft` |
| Review | `CourseStats.review` |
| Archived | `CourseStats.archived` |
| Scheduled | `CourseStats.scheduled` |
| Faculty Assigned | `CourseStats.facultyAssigned` |
| Programs | `CourseStats.programs` |
| Departments | `CourseStats.departments` |
| Average Duration | `CourseStats.averageDurationHours` |
| Total Credits | `CourseStats.totalCredits` |

## Distributions

- By department (`byDepartment`)
- By category (`byCategory`)
- By difficulty (`byDifficulty`)
- Recent activity (`recent`)

## Table

Enterprise data table with sticky header behavior, search, status filters, sorting, pagination, bulk selection, bulk publish / unpublish / archive, and links to create / import / export.

## Detail page sections

General information · Academic mapping · Faculty · Programs · Semesters · Learning objectives · Prerequisites · Requirements · Skills · SEO · Audit timeline

## Empty / loading / error

- Empty: illustration + title + description + create CTA
- Loading: skeleton cards / table rows
- Error: message + retry
