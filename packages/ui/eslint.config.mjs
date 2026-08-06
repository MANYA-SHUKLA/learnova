import { reactConfig } from '@learnova/eslint-config/react';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...reactConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
