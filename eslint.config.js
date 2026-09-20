import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

// Rules marked RATCHET are violated by code that predates the lint gate.
// They are warnings so the build stays green, and `npm run lint` caps the
// warning count at the number that existed when the gate went in (see the
// --max-warnings flag in package.json). New violations therefore fail CI,
// and every violation cleaned up lets the cap be lowered. Once a rule hits
// zero, promote it to "error" and drop it from this list.
const RATCHET = {
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': [
    'warn',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
  ],
  '@typescript-eslint/ban-ts-comment': 'warn',
};

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'supabase/.temp'] },

  // Browser app code.
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      ...RATCHET,
      // RATCHET, see above.
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Supabase Edge Functions run on Deno, not in the browser. Linting them
  // with browser globals reported Deno and the Web Crypto API as undefined.
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['supabase/functions/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.deno, ...globals.worker },
    },
    rules: RATCHET,
  },

  // Build configuration runs in Node.
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['*.{ts,js}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
    rules: {
      ...RATCHET,
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Generated from the database schema -- regenerate, do not hand-edit.
  {
    files: ['src/integrations/supabase/types.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },

  // Vendored shadcn/ui primitives, kept close to upstream.
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: { '@typescript-eslint/no-empty-object-type': 'off' },
  },
);
