/**
 * Roda uma vez antes de cada arquivo de teste (configurado em `vite.config.js`).
 *
 * O que entra aqui: matcher e limpeza que TODO teste precisa. O que não entra:
 * mock de serviço ou de rota — isso é decisão de cada teste, e escondido aqui
 * vira surpresa para quem lê o arquivo de teste isolado.
 */
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// O jsdom não implementa matchMedia, e o ThemeContext chama isso na primeira
// renderização para descobrir o tema do sistema. Sem o stub, qualquer teste
// que monte os providers quebra com "matchMedia is not a function".
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
    // Depreciados, mas ainda usados por algumas libs.
    addListener: () => {},
    removeListener: () => {},
  }),
})

afterEach(() => {
  // Desmonta o que ficou na tela. Com `globals: false` a Testing Library não
  // registra a limpeza automática, então ela é feita à mão.
  cleanup()
  // Tema e token de sessão moram no localStorage: sem limpar, um teste que
  // faz login vaza o usuário para o próximo.
  localStorage.clear()
})
