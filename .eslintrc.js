const disableRules = (rules) => rules.reduce((acc, rule) => ({ ...acc, [rule]: 'off' }), {});

const RULES_TO_DISABLE = [
  'import/extensions',
  'import/no-extraneous-dependencies',
  '@typescript-eslint/comma-dangle',
  '@typescript-eslint/space-before-blocks',
  '@typescript-eslint/lines-between-class-members',
  'id-blacklist',
  '@typescript-eslint/ban-types',
  'prefer-arrow/prefer-arrow-functions',
  'space-in-parens',
  'import/prefer-default-export',
  '@typescript-eslint/no-namespace',
  '@typescript-eslint/no-confusing-void-expression',
  '@typescript-eslint/indent',
  '@typescript-eslint/explicit-function-return-type',
  'no-trailing-spaces',
  'no-redeclare',
  '@typescript-eslint/no-redeclare',
  'no-extra-semi',
  '@typescript-eslint/no-extra-semi',
  'no-shadow',
  'no-useless-constructor',
];

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['dist/**'],
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        project: ['tsconfig.json'],
        createDefaultProgram: true,
        tsconfigRootDir: __dirname,
      },
      plugins: ['@typescript-eslint'],
      extends: ['eslint:recommended', 'airbnb-typescript/base'],
      rules: {
        // ERRORS
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'enum',
            format: ['PascalCase', 'UPPER_CASE'],
          },
        ],
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/no-shadow': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { args: 'all', argsIgnorePattern: '^_' }],
        '@typescript-eslint/naming-convention': ['error', { selector: 'enum', format: ['UPPER_CASE', 'PascalCase'] }],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],
        '@typescript-eslint/keyword-spacing': 'error',
        '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
        'no-console': ['error', { allow: ['warn', 'error'] }],
        'arrow-spacing': 'error',
        'brace-style': ['error', '1tbs', { allowSingleLine: true }],
        'comma-spacing': 'error',
        'no-useless-constructor': 'error',
        '@typescript-eslint/no-useless-constructor': 'error',
        'no-multiple-empty-lines': 'error',
        'no-unused-expressions': 'error',
        'no-dupe-class-members': 'error',
        '@typescript-eslint/type-annotation-spacing': 'error',
        'no-underscore-dangle': 'error',
        '@typescript-eslint/member-ordering': 'error',
        '@typescript-eslint/no-unused-expressions': 'error',
        'no-duplicate-imports': 'error',

        // WARNINGS
        '@typescript-eslint/no-shadow': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
        'comma-dangle': ['warn', 'always-multiline'],
        'arrow-body-style': 'warn',
        'max-len': [
          'warn',
          {
            code: 120,
            ignoreComments: true,
            ignoreUrls: true,
            ignoreTrailingComments: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
            ignoreRegExpLiterals: true,
          },
        ],
        'no-magic-numbers': 'off',
        '@typescript-eslint/no-magic-numbers': [
          'warn',
          {
            ignoreEnums: true,
            ignoreNumericLiteralTypes: true,
            ignoreReadonlyClassProperties: true,
            ignore: [1, 0, -1],
          },
        ],
        '@typescript-eslint/member-delimiter-style': [
          'warn',
          {
            multiline: {
              delimiter: 'semi',
              requireLast: true,
            },
            singleline: {
              delimiter: 'semi',
              requireLast: false,
            },
          },
        ],
        '@typescript-eslint/quotes': [
          'warn',
          'single',
          {
            avoidEscape: true,
          },
        ],
        'linebreak-style': 0,

        // DISABLED RULES
        ...disableRules(RULES_TO_DISABLE),
      },
    },
  ],
  extends: ['prettier'],
};
