import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // The constraints from the brief, enforced rather than documented.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#(?:[0-9a-fA-F]{3,4}){1,2}$/]',
          message: 'No raw hex colours — use a design token from styles/tokens.css.',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          // `const { note: _note, ...rest }` is the idiomatic way to omit a
          // key; the discarded binding is the point, not an oversight.
          ignoreRestSiblings: true,
        },
      ],
      // The 200-line component rule, enforced rather than documented.
      // Blank lines and comments are excluded: a well-explained component
      // should not be punished for the explanation.
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // Test + tooling files legitimately reach for looser typing.
    files: ['**/*.test.{ts,tsx}', 'e2e/**/*.ts', 'src/test/**/*.ts', '*.config.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      // A thorough suite is long by nature; splitting it to satisfy a line
      // count would scatter related assertions across files.
      'max-lines': 'off',
    },
  },
  {
    // The server and the build scripts report to a terminal — stdout is their
    // output channel, not a debugging leftover.
    files: ['server/**/*.{ts,tsx}', 'scripts/**/*.{ts,tsx}'],
    rules: { 'no-console': 'off', 'max-lines': 'off' },
  },
  {
    // The Open Graph card is rendered by Satori, which lays out a subset of
    // flexbox and has no notion of CSS custom properties — `var(--accent)`
    // renders as nothing. The palette there is a documented, single-file
    // duplicate of the dark theme, which is the honest trade.
    files: ['scripts/og.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    // The venue catalogue is data, not logic. It is long because the content
    // is real; splitting it per city would trade one honest long file for
    // eight short ones and an index.
    files: ['src/data/venues.ts', 'src/data/cities.ts'],
    rules: { 'max-lines': 'off' },
  },
  {
    // Config files are plain JS and outside the TS program — typed rules
    // cannot run on them and would otherwise fail the whole lint.
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
