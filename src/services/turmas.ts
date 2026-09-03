import api from './api'
import type { ApiEnvelope, MembroDoEspaco, Turma, TurmaInput } from '../types/api'

/**
 * As turmas de um espaço, e quem pode dar aula nelas (api#472, #461).
 *
 * ## Devolve o conteúdo já desembrulhado
 *
 * Como `professores.ts` e `sports.ts`, e diferente de `places.ts`, que devolve
 * a resposta bruta do axios. A convenção do arquivo é a de quem consome: a
 * página não deveria precisar saber que a api embrulha tudo em `data.data`.
 *
 * ## Tudo aqui é do dono
 *
 * A api guarda estas rotas com `isPlaceOwnerOrAdmin`, e **fora** do
 * `requireActiveSubscription` — a mesma decisão do expediente e do convite de
 * professor. A tela acompanha: não há `PlanGate` no caminho.
 */
const desembrulhar = <T>(r: { data: ApiEnvelope<T> }): T => r.data.data

export const turmasService = {
  listar: (placeId: string) =>
    api.get<ApiEnvelope<Turma[]>>(`/places/${placeId}/turmas`).then(desembrulhar),

  cadastrar: (placeId: string, dados: TurmaInput) =>
    api.post<ApiEnvelope<Turma>>(`/places/${placeId}/turmas`, dados).then(desembrulhar),

  /**
   * Editar e desativar são o **mesmo** `PATCH`.
   *
   * Não existe `DELETE` de turma na api, de propósito: turma que já teve aula e
   * matrícula não pode sumir levando a história junto. Desativar é
   * `{ ativa: false }`, e é por isso que não há um `remover` aqui — o nome
   * sugeriria uma operação que a api recusa a existir.
   */
  atualizar: (placeId: string, turmaId: string, dados: Partial<TurmaInput>) =>
    api.patch<ApiEnvelope<Turma>>(`/places/${placeId}/turmas/${turmaId}`, dados).then(desembrulhar),

  /**
   * Quem tem vínculo de professor com o espaço (api#461).
   *
   * Mora aqui, e não em `professores.ts`, porque quem a chama é o seletor de
   * professor **da turma**. O `professores.ts` é o livro de convites — outro
   * recurso, e a api#461 nasceu justamente de os dois terem sido confundidos.
   */
  membros: (placeId: string) =>
    api.get<ApiEnvelope<MembroDoEspaco[]>>(`/places/${placeId}/members`).then(desembrulhar),
}
