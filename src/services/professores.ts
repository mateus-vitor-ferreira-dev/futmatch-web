import api from './api'
import type {
  ApiEnvelope, ConviteDeProfessor, ConviteVerificado, LinkDeConviteDoEspaco, LinkVerificado,
} from '../types/api'

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

  /*
   * ─── O link ao portador (api#509) ──────────────────────────────────────────
   *
   * Outra família de rotas, e outro objeto. `/places/:id/invite-links` é do
   * dono; `/place-invite-links/*` é de quem recebeu — e não leva `placeId`,
   * pela mesma razão de `/place-invites/*`: exigi-lo obrigaria a tela a saber
   * de qual espaço é o link antes de ler o link.
   */

  /**
   * Gera com o padrão da api, e **sem corpo**.
   *
   * Um uso, sete dias. A tela não oferece validade nem limite de propósito
   * (decisão 2 da web#410): um formulário com "sem limite" ao lado de "um uso"
   * desfaria pela interface a proteção que a api monta por padrão.
   */
  gerarLink: (placeId: string) =>
    api
      .post<ApiEnvelope<LinkDeConviteDoEspaco>>(`/places/${placeId}/invite-links`)
      .then(desembrulhar),

  /** Todos, inclusive os inativos — cada um com `ativo` e o `motivo`. */
  links: (placeId: string) =>
    api
      .get<ApiEnvelope<LinkDeConviteDoEspaco[]>>(`/places/${placeId}/invite-links`)
      .then(desembrulhar),

  /** Fecha a porta. Não apaga a linha e não tira quem já entrou. */
  revogarLink: (placeId: string, linkId: string) =>
    api.delete<void>(`/places/${placeId}/invite-links/${linkId}`).then(() => undefined),

  /** Pública: responde sem sessão, para quem ainda não tem conta decidir. */
  verificarLink: (token: string) =>
    api
      .get<ApiEnvelope<LinkVerificado>>('/place-invite-links/verify', { params: { token } })
      .then(desembrulhar),

  /**
   * Entra pelo link. **201 quando o vínculo nasceu, 200 quando já existia** — e
   * a tela precisa dos dois: dizer "pronto!" num refresh faria o dono ver o
   * contador de usos não bater com a lista de pessoas.
   *
   * O corpo vai `undefined` pelo mesmo motivo do `aceitar` acima: o axios
   * serializa `null` como a string `"null"` e o `body-parser` recusa isso, com
   * o erro chegando como 500 sem nada na tela que ajude.
   */
  entrarPeloLink: (token: string) =>
    api
      .post<ApiEnvelope<{ id: string; papel: string; place: { id: string; name: string } }>>(
        '/place-invite-links/accept',
        undefined,
        { params: { token } },
      )
      .then((r) => ({ member: r.data.data, novo: r.status === 201 })),
}
