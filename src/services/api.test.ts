/**
 * Fluxo crítico: sessão expirada.
 *
 * O redirecionamento não mora em nenhuma tela — está no interceptor de
 * resposta do axios, que é o único ponto por onde toda chamada da aplicação
 * passa. Se ele parar de funcionar, o usuário com token expirado fica preso
 * numa tela que só mostra erro, sem entender que precisa entrar de novo.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import api, { SESSION_HINT_KEY, CSRF_HEADER, marcarSessao } from './api'
import { erroDaApi } from '../test/factories'

const adapterOriginal = api.defaults.adapter
const locationOriginal = window.location

/** Faz a próxima requisição falhar com o status pedido, sem tocar na rede. */
function respondeCom(status: number, mensagem = 'Falhou') {
  api.defaults.adapter = async () => {
    throw erroDaApi(mensagem, status)
  }
}

/** Responde 200 e devolve os headers com que a requisição saiu. */
function capturaHeaders(): { valor?: string; comCredenciais?: boolean } {
  const capturado: { valor?: string; comCredenciais?: boolean } = {}
  api.defaults.adapter = async (config) => {
    capturado.valor = config.headers?.[CSRF_HEADER] as string | undefined
    capturado.comCredenciais = config.withCredentials
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  }
  return capturado
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
  /**
   * O token não é mais anexado por ninguém: ele vive num cookie `httpOnly` que
   * este código não lê. Quem manda o cookie é o navegador, e só manda porque a
   * instância pede credenciais — a chamada é cross-origin.
   */
  it('manda credenciais, para o cookie de sessão viajar', async () => {
    const capturado = capturaHeaders()

    await api.get('/qualquer')

    expect(capturado.comCredenciais).toBe(true)
  })

  it('não anexa Authorization em requisição nenhuma', async () => {
    let enviado: string | undefined
    api.defaults.adapter = async (config) => {
      enviado = config.headers?.Authorization as string
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }

    marcarSessao()
    await api.get('/qualquer')

    expect(enviado).toBeUndefined()
  })

  it('manda o header de CSRF no que muda estado', async () => {
    const capturado = capturaHeaders()

    await api.post('/events', {})

    expect(capturado.valor).toBe('XMLHttpRequest')
  })

  /**
   * Em GET o header seria inútil e cobraria caro: header customizado obriga o
   * navegador a fazer preflight, e a API só exige CSRF em escrita.
   */
  it('não manda o header de CSRF em leitura', async () => {
    const capturado = capturaHeaders()

    await api.get('/events')

    expect(capturado.valor).toBeUndefined()
  })
})

describe('interceptor de resposta — sessão expirada', () => {
  it('no 401, esquece a sessão e manda para o login', async () => {
    marcarSessao()
    respondeCom(401, 'Token inválido')

    await expect(api.get('/auth/me')).rejects.toThrow()

    expect(localStorage.getItem(SESSION_HINT_KEY)).toBeNull()
    expect(window.location.href).toBe('/login')
  })

  /**
   * Visitante que nunca entrou também recebe 401 — em /register, ou no
   * /redefinir-senha?token=... que chega por e-mail. Redirecionar ali tiraria a
   * pessoa da tela onde ela precisa estar, e levaria o token da URL junto.
   */
  it('no 401 de quem nunca entrou, não redireciona', async () => {
    respondeCom(401, 'Token inválido')

    await expect(api.get('/auth/me')).rejects.toThrow()

    expect(window.location.href).toBe('http://localhost/home')
  })

  it('propaga o erro para quem chamou, em vez de engolir', async () => {
    respondeCom(401, 'Token inválido')

    await expect(api.get('/auth/me')).rejects.toMatchObject({
      response: { status: 401 },
    })
  })

  it('não desloga em erro que não é 401', async () => {
    marcarSessao()
    respondeCom(500, 'Erro interno')

    await expect(api.get('/events')).rejects.toThrow()

    // 500 é problema do servidor, não da sessão. Deslogar aqui perderia a
    // sessão de quem só pegou uma instabilidade da API.
    expect(localStorage.getItem(SESSION_HINT_KEY)).toBe('1')
    expect(window.location.href).toBe('http://localhost/home')
  })

  it('não desloga em 403 — autenticado, mas sem permissão', async () => {
    marcarSessao()
    respondeCom(403, 'Acesso negado')

    await expect(api.get('/admin/users')).rejects.toThrow()

    expect(localStorage.getItem(SESSION_HINT_KEY)).toBe('1')
    expect(window.location.href).toBe('http://localhost/home')
  })
})
