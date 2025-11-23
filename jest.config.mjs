/** @type {import('jest').Config} */
export default {
  preset: "ts-jest/presets/default-esm", // ESM-friendly preset
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    // Tell ts-jest to emit ESM
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json", useESM: true }],
  },
  extensionsToTreatAsEsm: [".ts"],
};
