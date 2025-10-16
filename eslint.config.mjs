import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  // Disable the TypeScript rule disallowing require() imports
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.cts", "**/*.mts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Also disable globally so JS files are not flagged either
  {
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
