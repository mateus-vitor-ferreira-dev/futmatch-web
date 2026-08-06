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

// O jsdom também não implementa EventSource, e o NotificationBell — que vive
// dentro do MainLayout, ou seja, em toda página logada — abre um stream SSE
// assim que encontra token no localStorage. Sem o stub, qualquer teste de
// página logada quebra com "EventSource is not defined".
//
// O stub não entrega mensagem nenhuma de propósito: teste que precise de
// notificação chegando deve mockar o serviço, não depender deste boneco.
class EventSourceStub {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSED = 2

  readyState = EventSourceStub.CONNECTING
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onopen: ((event: Event) => void) | null = null

  constructor(public url: string) {}

  close() {
    this.readyState = EventSourceStub.CLOSED
  }
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return false
  }
}
Object.defineProperty(window, 'EventSource', {
  writable: true,
  value: EventSourceStub,
})

afterEach(() => {
  // Desmonta o que ficou na tela. Com `globals: false` a Testing Library não
  // registra a limpeza automática, então ela é feita à mão.
  cleanup()
  // Tema e token de sessão moram no localStorage: sem limpar, um teste que
  // faz login vaza o usuário para o próximo.
  localStorage.clear()
})
