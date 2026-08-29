import api from './api'
import type { ApiEnvelope, PessoaDaRede } from '../types/api'

/**
 * Seguir, e a amizade que nasce do follow mútuo (api#387).
 *
 * **A amizade não tem endpoint próprio de escrita.** Não existe pedir nem
 * aceitar: duas pessoas são amigas quando as duas linhas de follow existem, e
 * `amigos()` é uma leitura derivada disso. Quem procurar aqui um
 * `aceitarAmizade` não vai achar, e é de propósito — o produto não tem esse
 * estado.
 *
 * **Seguir é assimétrico e imediato.** Ninguém precisa concordar, e por isso o
 * botão da tela não tem estado intermediário de "pedido enviado".
 */

const desembrulhar = <T>(r: { data: ApiEnvelope<T> }): T => r.data.data

export const followsService = {
  /**
   * Passa a seguir. A api usa `upsert`, então seguir duas vezes é seguir uma
   * vez — dois toques rápidos no botão não viram 409 na cara de quem clicou.
   */
  seguir: (userId: string) =>
    api.post<ApiEnvelope<{ id: string }>>(`/users/${userId}/follow`).then(desembrulhar),

  /**
   * Deixa de seguir. Responde `{ desfeito: false }` quando não havia o que
   * desfazer, e não 404: a intenção "não quero mais seguir" está satisfeita
   * nos dois casos.
   */
  deixarDeSeguir: (userId: string) =>
    api.delete<ApiEnvelope<{ desfeito: boolean }>>(`/users/${userId}/follow`).then(desembrulhar),

  /** Quem segue esta pessoa. */
  seguidores: (userId: string) =>
    api.get<ApiEnvelope<PessoaDaRede[]>>(`/users/${userId}/followers`).then(desembrulhar),

  /** Quem esta pessoa segue. */
  seguindo: (userId: string) =>
    api.get<ApiEnvelope<PessoaDaRede[]>>(`/users/${userId}/following`).then(desembrulhar),

  /**
   * Os mútuos de quem está logado.
   *
   * Só existe para "eu": a api não expõe os amigos de terceiros, e a tela da
   * pessoa mostra seguidores e seguindo — que são públicos — em vez de inventar
   * a interseção no cliente.
   */
  meusAmigos: () =>
    api.get<ApiEnvelope<PessoaDaRede[]>>('/users/me/friends').then(desembrulhar),
}
