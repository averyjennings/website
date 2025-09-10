import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**', 'test-results/**', 'public/**', '*.config.js', '*.config.ts', 'vite.config.ts', 'playwright.config.ts', 'scripts/**', 'tests/**', 'supabase/**']
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        // Browser globals
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        localStorage: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        
        // DOM types
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLMetaElement: 'readonly',
        SVGSVGElement: 'readonly',
        Element: 'readonly',
        MouseEvent: 'readonly',
        TouchEvent: 'readonly',
        MutationObserver: 'readonly',
        ImageData: 'readonly',
        ImageBitmap: 'readonly',
        Blob: 'readonly',
        CanvasRenderingContext2D: 'readonly',
        IntersectionObserver: 'readonly',
        StorageEvent: 'readonly',
        
        // Node.js types
        NodeJS: 'readonly',
        process: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        
        // TypeScript/Other
        Promise: 'readonly',
        RequestInit: 'readonly',
        React: 'readonly',
        
        // Google Analytics
        gtag: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react-hooks': reactHooks
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': 'off',
      'no-unused-vars': 'off' // Handled by @typescript-eslint/no-unused-vars
    }
  },
  prettier
];