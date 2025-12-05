import parser from "@typescript-eslint/parser";
import plugin from "@typescript-eslint/eslint-plugin";

export default [
    // Basic configuration: Inherits ESLint's recommended rules by default.
    {
        ignores: ["dist/**", "example/**", "node_modules/**"],
    },
    // TypeScript specific configuration
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser,
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname, // ensures correct path resolution
            },

        },
        plugins: {
            "@typescript-eslint": plugin,
        },
        rules: {
            // Pull in the recommended ruleset
            ...plugin.configs.recommended.rules,

            // Or can add rules specific to your project here, for example:
            // "@typescript-eslint/no-unused-vars": "warn",
            // "@typescript-eslint/no-explicit-any": "off",
            // "@typescript-eslint/consistent-type-imports": "warn",
        }
    },
];