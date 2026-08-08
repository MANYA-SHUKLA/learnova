const checks: { path: string; required: string[] }[] = [
  {
    path: 'frontend/.env.local',
    required: [
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_API_URL',
      'NEXT_PUBLIC_WS_URL',
      'NEXT_PUBLIC_DEFAULT_LOCALE',
    ],
  },
  {
    path: 'backend/.env',
    required: [
      'PORT',
      'MONGODB_URI',
      'REDIS_URL',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'CORS_ORIGINS',
    ],
  },
  {
    path: 'worker/.env',
    required: ['MONGODB_URI', 'REDIS_URL', 'WORKER_CONCURRENCY'],
  },
];
