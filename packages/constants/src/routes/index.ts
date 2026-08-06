/** Canonical route / path prefixes — frontend + backend */

export const API_ROUTES = {
  V1: '/api/v1',
  INTERNAL: '/api/internal',
  WEBHOOKS: '/api/webhooks',
  HEALTH: '/health',
  AUTH: '/auth',
  LMS: '/lms',
  ERP: '/erp',
  EXAMINATION: '/examination',
  CODING: '/coding',
  IDE: '/ide',
  IDEATION: '/ideation',
  ANALYTICS: '/analytics',
  AUDIT: '/audit',
  USERS: '/users',
} as const;

export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  COURSES: '/courses',
  EXAMS: '/exams',
  CODING: '/coding',
  IDE: '/ide',
  IDEATION: '/ideation',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
} as const;

export const SOCKET_NAMESPACES = {
  IDE: '/ide',
  EXAM: '/exam',
  NOTIFICATIONS: '/notifications',
} as const;
