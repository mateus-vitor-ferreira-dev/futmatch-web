import api from './api'
import type { ApiEnvelope, ConviteDeProfessor, ConviteVerificado } from '../types/api'

/**
 * Os convites de professor de um espaço (api#451).
 *
 * ## Duas metades, dois donos
 *
 * `/places/:placeId/invites` é do **dono do espaço** — quem convida e acompanha.
 * `/place-invites/*` é de **quem foi convidado**, e não leva `placeId`: exigi-lo
 * na URL obrigaria a tela a saber de qual espaço é o convite antes de ler o
 * convite, que é justamente o que ela vai lá descobrir.
 *
 * ## O `verify` é público
 *
 * Quem ainda não tem conta precisa ver de quem é o convite antes de decidir se
 * vale se cadastrar. É por isso que a página do convite funciona deslogada, e
 * por isso esta função não pressupõe sessão.
 */

const desembrulhar = <T>(r: { data: ApiEnvelope<T> }): T => r.data.data

export const professoresService = {
  /**
   * Convida por e-mail. O e-mail é o identificador porque é o que o dono tem na
   * mão — ele sabe o e-mail do professor, não o id dele no Só+1. Funciona para
   * quem já tem conta e para quem ainda não tem.
   */
  convidar: (placeId: string, email: string) =>
    api
      .post<ApiEnvelope<ConviteDeProfessor>>(`/places/${placeId}/invites`, { email })
      .then(desembrulhar),

  /** Os convites do espaço, do mais novo para o mais velho. */
  convites: (placeId: string) =>
    api.get<ApiEnvelope<ConviteDeProfessor[]>>(`/places/${placeId}/invites`).then(desembrulhar),

  /** Pública: responde sem sessão. */
  verificar: (token: string) =>
    api
      .get<ApiEnvelope<ConviteVerificado>>('/place-invites/verify', { params: { token } })
      .then(desembrulhar),

  /*
   * O corpo vai `undefined`, e não `null`.
   *
   * As duas rotas leem só o `token` da query — não há corpo a mandar. Mas o
   * axios serializa `null` como a string `"null"` e ainda assim manda
   * `Content-Type: application/json`, e o `body-parser` recusa isso. O erro
   * chega como 500, sem nada na tela que ajude: a requisição nunca alcança o
   * controller. Com `undefined` ele não envia corpo nenhum.
   */
  aceitar: (token: string) =>
    api
      .post<ApiEnvelope<{ id: string; papel: string; place: { id: string; name: string } }>>(
        '/place-invites/accept',
        undefined,
        { params: { token } },
      )
      .then(desembrulhar),

  recusar: (token: string) =>
    api
      .post<ApiEnvelope<{ status: 'DECLINED'; place: { id: string; name: string } }>>(
        '/place-invites/decline',
        undefined,
        { params: { token } },
      )
      .then(desembrulhar),
}
