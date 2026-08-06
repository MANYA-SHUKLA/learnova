export const APP_CONFIG = {
  name: 'Learnova',
  description: 'Enterprise AI Learning Platform',
  supportEmail: 'support@learnova.app',
} as const;

export const ROUTES = {
  home: '/',
  login: '/login',
  registerInstitution: '/register-institution',
  forgotPassword: '/forgot-password',
  dashboard: '/institution/dashboard',
  features: '/features',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  security: '/security',
  student: '/student/dashboard',
  faculty: '/faculty/dashboard',
  admin: '/institution/dashboard',
} as const;
