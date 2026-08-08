import { API_ROUTES } from '@learnova/constants';
import { apiClient } from '@/lib/api/client';

const base = API_ROUTES.REPORTS;

function toQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export interface InstitutionReport {
  overview: {
    totalStudents: number;
    totalFaculty: number;
    activeCourses: number;
    courseCompletionRate: number;
    examPassPercentage: number;
    activeEnrollments: number;
    completedEnrollments: number;
  };
  departments: {
    departmentId: string | null;
    label: string;
    studentCount: number;
    completedEnrollments: number;
    averageProgress: number;
  }[];
  semesters: {
    semesterId: string;
    label: string;
    studentCount: number;
    averageGpa: number | null;
    earnedCredits: number;
  }[];
}

export interface FacultyReport {
  courseId: string;
  assignmentCompletionRate: number;
  examPassRate: number;
  averageExamScore: number;
  courseProgress: {
    averageProgress: number;
    studentsCompleted: number;
    studentsInProgress: number;
  };
  studentPerformance: {
    studentId: string;
    percentage: number | null;
    letterGrade: string | null;
    result: string | null;
  }[];
}

export interface StudentReport {
  learningProgress: {
    coursesInProgress: number;
    completedCourses: number;
    hoursLearned: number;
    lessonsCompleted: number;
    averageProgress: number;
  };
  grades: {
    courseId: string;
    courseTitle: string;
    percentage: number | null;
    letterGrade: string | null;
    result: string | null;
  }[];
  completedCourseCount: number;
  attendance: null;
  attendanceNote: string;
}

export const reportsApi = {
  institution: (params?: { departmentId?: string; semesterId?: string }) =>
    apiClient.get<InstitutionReport>(`${base}/institution${toQuery(params ?? {})}`),

  faculty: (courseId: string) =>
    apiClient.get<FacultyReport>(`${base}/faculty${toQuery({ courseId })}`),

  student: () => apiClient.get<StudentReport>(`${base}/student`),

  exportUrl: (params: {
    scope: 'institution' | 'faculty' | 'student';
    format: 'csv' | 'excel' | 'pdf';
    courseId?: string;
    departmentId?: string;
    semesterId?: string;
  }) => {
    const query = toQuery({
      scope: params.scope,
      format: params.format,
      courseId: params.courseId,
      departmentId: params.departmentId,
      semesterId: params.semesterId,
    });
    return `${process.env['NEXT_PUBLIC_API_URL'] ?? ''}/api/v1${base}/export${query}`;
  },
};
