import api from './api'
import type { ApiEnvelope, Matricula, MatriculaInput } from '../types/api'

/**
 * Os alunos de uma turma (api#474).
 *
 * ## O histórico vem por query, e o `routes.ts` não denuncia isso
 *
 * `GET .../matriculas?historico=true` devolve quem saiu junto. O parâmetro não
 * aparece no `matricula.routes.ts` — não há `validateQuery` ali —, quem o lê é
 * o controller (`req.query.historico === "true"`). Olhar só a rota leva a
 * concluir que a api não oferece isso, e ela oferece.
 *
 * ## Sair não é apagar
 *
 * O `DELETE` carimba `saiuEm` e mantém a linha: a mensalidade aponta para a
 * matrícula, e apagar quem saiu levaria junto o registro de quem pagou março.
 * O nome aqui é `tirarDaTurma`, e não `remover`, porque é o que ele faz.
 */
const desembrulhar = <T>(r: { data: ApiEnvelope<T> }): T => r.data.data

export const matriculasService = {
  listar: (placeId: string, turmaId: string, comHistorico = false) =>
    api
      .get<ApiEnvelope<Matricula[]>>(
        `/places/${placeId}/turmas/${turmaId}/matriculas${comHistorico ? '?historico=true' : ''}`,
      )
      .then(desembrulhar),

  matricular: (placeId: string, turmaId: string, dados: MatriculaInput) =>
    api
      .post<ApiEnvelope<Matricula>>(`/places/${placeId}/turmas/${turmaId}/matriculas`, dados)
      .then(desembrulhar),

  corrigir: (placeId: string, turmaId: string, matriculaId: string, dados: Partial<MatriculaInput>) =>
    api
      .patch<ApiEnvelope<Matricula>>(`/places/${placeId}/turmas/${turmaId}/matriculas/${matriculaId}`, dados)
      .then(desembrulhar),

  tirarDaTurma: (placeId: string, turmaId: string, matriculaId: string) =>
    api
      .delete<ApiEnvelope<Matricula>>(`/places/${placeId}/turmas/${turmaId}/matriculas/${matriculaId}`)
      .then(desembrulhar),
}
