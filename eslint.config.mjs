import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      // Gambar hasil generate adalah data URL base64 dinamis (bukan aset
      // statis), dan next/image dijalankan unoptimized di proyek ini.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
