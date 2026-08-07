import type {
  AssignSeatingInput,
  CheckInExamInput,
  CreateExamInput,
  ExamBulkActionInput,
  ExamListQuery,
  ProctorEventInput,
  StartExamAttemptInput,
  SubmitExamInput,
  UpdateExamInput,
} from '@learnova/validation';
import type { PaginatedMeta } from '@learnova/types';

export type ExamListParams = Partial<ExamListQuery>;
export type ExamCreateBody = CreateExamInput;
export type ExamUpdateBody = UpdateExamInput;
export type CheckInBody = CheckInExamInput;
export type StartAttemptBody = StartExamAttemptInput;
export type SubmitExamBody = SubmitExamInput;
export type ProctorEventBody = ProctorEventInput;
export type BulkActionBody = ExamBulkActionInput;
export type AssignSeatingBody = AssignSeatingInput;

export interface ExamListResult {
  items: import('@learnova/types').Exam[];
  meta: PaginatedMeta;
}
