import globals from 'globals';
import pluginJs from '@eslint/js';
import babelParser from '@babel/eslint-parser';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  {
    // 1) Qué archivos va a analizar ESLint
    files: ['**/*.{js,mjs,cjs,jsx}'],
    // Carpetas a ignorar
    ignores: ['node_modules/', 'dist/'],

    // 2) Configuración general del lenguaje
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 'latest', // O 2022/2023
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true, // habilita JSX
        },
        // Para que Babel sepa que usas React
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
      },
      // Variables globales del navegador
      globals: globals.browser,
    },

    // 3) Plugins que usarás
    plugins: {
      prettier: prettierPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },

    // 4) Reglas que quieres habilitar
    rules: {
      // Reglas recomendadas de ESLint y React
      ...pluginJs.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // Prettier: marca como error cuando formateo no coincide con Prettier
      'prettier/prettier': 'error',

      // Errores / advertencias comunes
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'no-undef': 'error', // Marcar variables no definidas
      eqeqeq: 'warn', // Usar === en vez de ==
      'no-var': 'error', // Uso estricto de let/const
      'prefer-const': 'warn', // Recomienda const sobre let
      'linebreak-style': 0, // Desactiva diferencia CRLF vs LF (Windows vs Linux)

      // Para React 17+ ya no se requiere 'import React' en cada archivo
      // Si diera error, puedes desactivar:
      // 'react/react-in-jsx-scope': 'off',
    },
  },
];
