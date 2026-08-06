import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // 'coverage' é o relatório gerado pelo `npm run test:coverage` — código de
  // terceiro, não nosso, e o ESLint reclamava dos arquivos dele.
  globalIgnores(['dist', 'coverage']),

  // Arquivos .js na raiz — este config e nada mais. O `src` é todo TypeScript
  // desde a migração, e o `tsconfig` desliga `allowJs` para impedir a volta.
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },

  // O código do app. Até aqui não existia bloco para .ts/.tsx: como no flat
  // config um arquivo que não casa com nenhum `files` é lido sem regra
  // nenhuma, o `npm run lint` passava verde sem olhar uma linha de `src`.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      // Quem acusa variável não usada em TypeScript é a regra do
      // typescript-eslint; a do core não entende tipo e dá falso positivo em
      // parâmetro só de tipo. Prefixo `_` marca o descarte intencional.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },

  // Arquivos de teste rodam no Vitest, não no navegador.
  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // O helper de teste exporta função e componente do mesmo arquivo de
      // propósito — a regra existe para não quebrar o Fast Refresh, e teste
      // não passa por Fast Refresh.
      'react-refresh/only-export-components': 'off',
    },
  },
])
