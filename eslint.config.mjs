import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import storybook from "eslint-plugin-storybook";

const eslintConfig = [
  {
    ignores: [
      ".storybook/**/*",
      "__tests__/**/*",
      "src/generated/**/*",
      "coverage/**/*",
      ".next/**/*",
      "storybook-static/**/*",
      "playwright-report/**/*",
      "test-results/**/*",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  ...storybook.configs["flat/recommended"],
  {
    files: ["**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
