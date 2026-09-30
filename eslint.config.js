import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        rules: {
            "no-console": "warn",
            "no-debugger": "error",
            "no-unused-vars": "warn",
            "no-undef": "off"
        }
    }
];
