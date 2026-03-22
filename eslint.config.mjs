import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    ignores: [
      ".next/**",
      ".claude/**",
      "coverage/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  // Stricter TypeScript rules (Phase 1, Sub-Phase 3)
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Enforce `import type { ... }` for type-only imports
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // Discourage `any` to maintain type safety
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default config;
