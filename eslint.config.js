import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'consistent-return': 'off',
      curly: 'error',
      'dot-notation': 'error',
      eqeqeq: 'error',
      indent: ['error', 2, { SwitchCase: 1 }],
      'linebreak-style': ['error', 'unix'],
      'no-console': 'off',
      'no-else-return': 'error',
      'no-lonely-if': 'warn',
      'no-multi-spaces': 'warn',
      'no-multiple-empty-lines': 'warn',
      'no-nested-ternary': 'error',
      'no-shadow': 'error',
      'no-throw-literal': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'space-before-blocks': 'error',
      yoda: ['error', 'never'],
    },
  },
];
