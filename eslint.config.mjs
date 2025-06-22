import { defineConfig } from 'eslint/config'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'

export default defineConfig(
  {
    ignores: ['node_modules', 'package', '.build'],
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [eslint.configs.recommended, prettierRecommended],
    plugins: {
      prettierPlugin,
    },
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      prettierRecommended,
    ],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettierPlugin,
    },
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
  },
)
