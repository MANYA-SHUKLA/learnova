import { API_ROUTES } from '@learnova/constants';
import type {
  AcceptBlueprintInput,
  AcceptOutlineInput,
  AcceptQuizInput,
  AiBlueprintProposal,
  AiOutlineProposal,
  AiQuizProposal,
  GenerateBlueprintInput,
  GenerateOutlineInput,
  GenerateQuizInput,
} from '@learnova/validation';
import { apiClient } from '@/lib/api/client';

const base = (courseId: string) => `${API_ROUTES.AI}/courses/${courseId}`;

export const aiContentApi = {
  generateOutline: (courseId: string, body: GenerateOutlineInput) =>
    apiClient.post<AiOutlineProposal>(`${base(courseId)}/outline`, body),
  acceptOutline: (courseId: string, body: AcceptOutlineInput) =>
    apiClient.post<{ moduleIds: string[]; lessonIds: string[]; builderPath: string }>(
      `${base(courseId)}/outline/accept`,
      body,
    ),
  generateQuiz: (courseId: string, body: GenerateQuizInput) =>
    apiClient.post<AiQuizProposal>(`${base(courseId)}/quiz`, body),
  acceptQuiz: (courseId: string, body: AcceptQuizInput) =>
    apiClient.post<{ questionBankId: string; questionIds: string[]; quizId: string; status: string }>(
      `${base(courseId)}/quiz/accept`,
      body,
    ),
  generateBlueprint: (courseId: string, body: GenerateBlueprintInput) =>
    apiClient.post<AiBlueprintProposal>(`${base(courseId)}/exam-blueprint`, body),
  acceptBlueprint: (courseId: string, body: AcceptBlueprintInput) =>
    apiClient.post<{ blueprintId: string; examId: string | null; status: string }>(
      `${base(courseId)}/exam-blueprint/accept`,
      body,
    ),
};
