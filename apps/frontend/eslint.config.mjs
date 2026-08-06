import { nextConfig } from '@learnova/eslint-config/next';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
