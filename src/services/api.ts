import axios, { AxiosError } from 'axios'
import { env } from '../config/env'

/**
 * Marca de que existe sessão — **não é credencial**.
 *
 * O token não mora mais aqui: ele vem em cookie `httpOnly`, que este código não
 * consegue ler nem escrever, e é justamente esse o ponto. O que sobra no
 * localStorage é um "sim, esta pessoa entrou", usado só para duas decisões de
 * interface: chamar ou não o `/auth/me` ao abrir o app, e redirecionar ou não
 * para o login quando a API responde 401.
 *
 * Forjar esta chave à mão não autentica nada — no máximo gera uma requisição
 * que volta 401 e apaga a marca de volta.
 */
export const SESSION_HINT_KEY = 'só+1:sessao'

export const marcarSessao   = () => localStorage.setItem(SESSION_HINT_KEY, '1')
export const esquecerSessao = () => localStorage.removeItem(SESSION_HINT_KEY)
export const temSessao      = () => localStorage.getItem(SESSION_HINT_KEY) !== null

/** Header exigido pela API em requisição que muda estado — ver o interceptor. */
export const CSRF_HEADER = 'X-Requested-With'

const METODOS_QUE_MUDAM_ESTADO = ['post', 'put', 'patch', 'delete']

/**
 * Instância Axios compartilhada por todos os serviços.
 *
 * `withCredentials` é o que faz o cookie de sessão viajar: a chamada é
 * cross-origin (`app.` → `api.so-mais-um.com`), e sem ele o navegador não anexa
 * cookie nenhum.
 *
 * Interceptors configurados:
 *  - Request: manda o header de CSRF no que muda estado.
 *  - Response: em caso de 401, esquece a sessão e redireciona para /login.
 */
const api = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

/**
 * Só nos métodos que mudam estado, e não em toda requisição, porque é só neles
 * que a API exige — e header customizado em GET obrigaria preflight à toa.
 */
api.interceptors.request.use((config) => {
  const metodo = (config.method ?? 'get').toLowerCase()
  if (METODOS_QUE_MUDAM_ESTADO.includes(metodo)) {
    config.headers[CSRF_HEADER] = 'XMLHttpRequest'
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    /**
     * O `temSessao()` não é detalhe: sem ele, o 401 de quem nunca entrou —
     * visitante em /register ou em /redefinir-senha?token=... — mandaria a
     * pessoa para o login e levaria o token da URL junto.
     */
    if (err.response?.status === 401 && temSessao()) {
      esquecerSessao()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
