module.exports = {
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/src/payload/payload-types.ts', // Auto-generated
    '/src/payload/generated-schema.graphql', // Auto-generated
    '/src/app/_css/', // Styles
    '/src/app/_graphql/', // GraphQL queries, not typically unit tested this way
    // Add other paths to ignore for coverage if needed (e.g., config files, specific utilities)
    '/src/payload/payload.config.ts',
    '/src/payload/dotenv.js',
    '/src/payload/emptyModuleMock.js',
    '/src/server.ts',
    '/src/server.default.ts',
    '/middleware.ts', // Clerk middleware, testing might be complex
    '/src/app/layout.tsx', // Root layout
    // Specific UI components that are mostly presentational or highly integrated
    // might be better tested with E2E or integration tests.
    // '/src/app/_components/AdminBar/',
    // '/src/app/_components/Footer/',
    // '/src/app/_components/Header/',
  ],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    'json',
    'text',
    'lcov',
    'clover'
  ],

  // An object that configures minimum threshold enforcement for coverage results
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: -10,
  //   },
  // },

  // The root directory that Jest should scan for tests and modules within
  rootDir: '.',

  // A list of paths to directories that Jest should use to search for files in
  roots: [
    '<rootDir>/src'
  ],

  // The setup files to run before each test file in the suite.
  // This is a good place to import @testing-library/jest-dom for DOM matchers.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // The test environment that will be used for testing
  testEnvironment: 'jest-environment-jsdom', // For React components and DOM testing

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],

  // A map from regular expressions to paths to transformers
  transform: {
    // Use babel-jest for ts, tsx, js, jsx files
    '^.+\\.(t|j)sx?$': 'babel-jest',
  },

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [
    '/node_modules/',
    '\\.pnp\\.[^\\/]+$'
  ],

  // Module name mapper for handling module aliases (if you use them in tsconfig.json paths)
  // and for mocking static assets or CSS modules.
  moduleNameMapper: {
    // Mock CSS Modules
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
    // Mock static assets
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    // Handle module aliases from tsconfig.json if any, e.g.:
    // '^@/components/(.*)$': '<rootDir>/src/components/$1',
  },

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,
};
