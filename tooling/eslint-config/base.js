/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  extends: ['universe', 'plugin:prettier/recommended'],
  plugins: ['unused-imports', 'simple-import-sort', 'prettier'],
  rules: {
    // TypeScript rules
    '@typescript-eslint/consistent-indexed-object-style': 'error',
    '@typescript-eslint/consistent-type-definitions': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',

    // Import sorting
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    'import/order': 'off',
    'sort-imports': 'off',
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          ['^react', '^@?\\w'], // Packages
          ['^(@gonasi|core|ui|app|utils|types|test-utils)(/.*|$)'], // Internal
          ['^\\u0000'], // Side effects
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$', '^.+\\.s?css$'], // Relative
        ],
      },
    ],

    // Unused imports
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      {
        args: 'after-used',
        argsIgnorePattern: '^_',
        vars: 'all',
        varsIgnorePattern: '^_',
      },
    ],

    // Code style
    'prefer-template': 'error',

    // Prettier
    'prettier/prettier': [
      'error',
      {
        quoteProps: 'as-needed',
        jsxSingleQuote: true,
        bracketSameLine: false,
        bracketSpacing: true,
        singleQuote: true,
        trailingComma: 'all',
        printWidth: 100,
        semi: true,
        tabWidth: 2,
        useTabs: false,
      },
    ],
  },
};

module.exports = config;
