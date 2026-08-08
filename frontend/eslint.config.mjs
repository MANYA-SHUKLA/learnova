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
  {
    // Production build baseline — strictTypeChecked defaults are too noisy for the full App Router surface.
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: { attributes: false, properties: false },
        },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-base-to-string': 'warn',
      '@typescript-eslint/no-deprecated': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/no-unnecessary-type-conversion': 'warn',
    },
  },
];
