const defaultConfig = require('react-scripts/scripts/utils/createJestConfig')(
  (p) => require.resolve('react-scripts/scripts/test.js'),
  null,
  false
);

module.exports = {
  ...defaultConfig,

  // Custom setup files
  setupFilesAfterEnv: [
    ...defaultConfig.setupFilesAfterEnv,
    '<rootDir>/src/setupTests.ts'
  ],

  // Module name mapping for imports
  moduleNameMapper: {
    ...defaultConfig.moduleNameMapper,
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/setupTests.ts',
    '!src/react-app-env.d.ts',
    '!src/tests/**',
    '!src/assets/**',
  ],

  coverageDirectory: 'coverage/frontend',
  coverageReporters: ['text', 'lcov', 'html', 'json'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Timeout for async tests
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Detect open handles
  detectOpenHandles: true,

  // Force exit to prevent hanging
  forceExit: true,

  // Verbose output
  verbose: true,
};
