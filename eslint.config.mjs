// eslint.config.mjs
import js from '@eslint/js';
import globals from 'globals';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginImport from 'eslint-plugin-import';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // Ignore build artifacts
  { ignores: ['node_modules/**', 'dist/**', 'build/**', '.husky/**', '.pnpm-store/**'] },

  // Base JS rules
  js.configs.recommended,

  // Project rules (JS/TS/React)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      // Flat config: specify TS parser explicitly (even for JS it’s fine)
      parser: (await import('@typescript-eslint/parser')).default,
      parserOptions: {
        // Keep it simple (no project type-checking here). We already run `tsc` in `pnpm typecheck`.
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: { ...globals.browser, ...globals.node, ...globals.es2021 },
    },
    plugins: {
      react: eslintPluginReact,
      import: eslintPluginImport,
      '@typescript-eslint': (await import('@typescript-eslint/eslint-plugin')).default,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // import hygiene
      'import/order': [
        'warn',
        { 'newlines-between': 'always', alphabetize: { order: 'asc', caseInsensitive: true } },
      ],
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // react 17+ doesn’t need React in scope
      'react/react-in-jsx-scope': 'off',
    },
  },

  // Make ESLint play nice with Prettier formatting
  eslintConfigPrettier,
];
