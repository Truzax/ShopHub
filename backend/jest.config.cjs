module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'controllers/**/*.ts',
    'middleware/**/*.ts',
    '!**/*.d.ts',
    '!dist/**',
    '!coverage/**',
  ],
  clearMocks: true,
};