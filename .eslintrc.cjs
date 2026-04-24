module.exports = {
  extends: [
    '@electron-toolkit/eslint-config-ts/recommended',
    '@electron-toolkit/eslint-config-prettier',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  },
  ignorePatterns: ['dist', 'out', 'release', 'node_modules']
}
