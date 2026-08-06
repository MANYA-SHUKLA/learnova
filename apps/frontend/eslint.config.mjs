import { nextConfig } from '@learnova/eslint-config/next';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextConfig,
  {
    ignores: ['next.config.ts', 'next-env.d.ts', '.next/**'],
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
    // next-intl setRequestLocale is still the supported App Router pattern until root-params migrates
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-deprecated': 'off',
    },
  },
];
