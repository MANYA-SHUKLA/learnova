import { APP_ROUTES } from '@learnova/constants';

/** Student my-team route — uses APP_ROUTES when constants package includes STUDENT_MY_TEAM */
export const STUDENT_MY_TEAM =
  'STUDENT_MY_TEAM' in APP_ROUTES
    ? String((APP_ROUTES as Record<string, string>)['STUDENT_MY_TEAM'])
    : '/student/my-team';
