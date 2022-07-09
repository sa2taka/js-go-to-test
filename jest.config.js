/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  preset: 'ts-jest',
  modulePaths: ['<rootDir>/'],
  testPathIgnorePatterns: ['/__tests__/helpers/'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.build.json',
    },
  },

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  coveragePathIgnorePatterns: ['/node_modules', 'src/config.ts'],

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
};
