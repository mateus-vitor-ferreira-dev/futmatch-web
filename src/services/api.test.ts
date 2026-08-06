/**
 * Fluxo crítico: sessão expirada.
 *
 * O redirecionamento não mora em nenhuma tela — está no interceptor de
 * resposta do axios, que é o único ponto por onde toda chamada da aplicação
 * passa. Se ele parar de funcionar, o usuário com token expirado fica preso
 * numa tela que só mostra erro, sem entender que precisa entrar de novo.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import api, { TOKEN_KEY } from './api'
import { erroDaApi } from '../test/factories'

const adapterOriginal = api.defaults.adapter
const locationOriginal = window.location

/** Faz a próxima requisição falhar com o status pedido, sem tocar na rede. */
function respondeCom(status: number, mensagem = 'Falhou') {
  api.defaults.adapter = async () => {
    throw erroDaApi(mensagem, status)
  }
}

beforeEach(() => {
  // jsdom não navega: atribuir href de verdade só emitiria "Not implemented:
  // navigation" no console e deixaria o valor intacto. Trocar o objeto é o que
  // permite afirmar para onde o código mandou o usuário.
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { href: 'http://localhost/home' },
  })
})

afterEach(() => {
  api.defaults.adapter = adapterOriginal
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: locationOriginal,
  })
})

describe('interceptor de requisição', () => {
  it('anexa o Bearer token quando existe sessão', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-abc')
    let enviado: string | undefined
    api.defaults.adapter = async (config) => {
      enviado = config.headers?.Authorization as string
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }

    await api.get('/qualquer')

    expect(enviado).toBe('Bearer token-abc')
  })

  it('não anexa header nenhum quando não há sessão', async () => {
    let enviado: string | undefined
    api.defaults.adapter = async (config) => {
      enviado = config.headers?.Authorization as string
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }

    await api.get('/qualquer')

    expect(enviado).toBeUndefined()
  })
})

describe('interceptor de resposta — sessão expirada', () => {
  it('no 401, descarta o token e manda para o login', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-expirado')
    respondeCom(401, 'Token inválido')

    await expect(api.get('/auth/me')).rejects.toThrow()

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(window.location.href).toBe('/login')
  })

  it('propaga o erro para quem chamou, em vez de engolir', async () => {
    respondeCom(401, 'Token inválido')

    await expect(api.get('/auth/me')).rejects.toMatchObject({
      response: { status: 401 },
    })
  })

  it('não desloga em erro que não é 401', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-valido')
    respondeCom(500, 'Erro interno')

    await expect(api.get('/events')).rejects.toThrow()

    // 500 é problema do servidor, não da sessão. Deslogar aqui perderia a
    // sessão de quem só pegou uma instabilidade da API.
    expect(localStorage.getItem(TOKEN_KEY)).toBe('token-valido')
    expect(window.location.href).toBe('http://localhost/home')
  })

  it('não desloga em 403 — autenticado, mas sem permissão', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-valido')
    respondeCom(403, 'Acesso negado')

    await expect(api.get('/admin/users')).rejects.toThrow()

    expect(localStorage.getItem(TOKEN_KEY)).toBe('token-valido')
    expect(window.location.href).toBe('http://localhost/home')
  })
})
