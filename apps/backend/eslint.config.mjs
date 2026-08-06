import { nodeConfig } from '@learnova/eslint-config/node';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nodeConfig,
  {
    ignores: ['**/.gitkeep.ts', 'vitest.config.ts'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: [
      'src/middlewares/auth.middleware.ts',
      'src/middlewares/request-id.middleware.ts',
    ],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
    },
  },
];
