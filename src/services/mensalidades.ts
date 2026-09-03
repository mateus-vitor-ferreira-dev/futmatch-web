import api from './api'
import type { ApiEnvelope, MensalidadeDaTurma } from '../types/api'

const desembrulhar = <T>(r: { data: ApiEnvelope<T> }): T => r.data.data

export const mensalidadesService = {
  listar: (placeId: string, turmaId: string, competencia: string) =>
    api
      .get<ApiEnvelope<MensalidadeDaTurma>>(
        `/places/${placeId}/turmas/${turmaId}/mensalidades?competencia=${competencia}`,
      )
      .then(desembrulhar),

  marcar: (placeId: string, turmaId: string, matriculaId: string, competencia: string) =>
    api
      .put<ApiEnvelope<unknown>>(
        `/places/${placeId}/turmas/${turmaId}/mensalidades/${matriculaId}`,
        { competencia },
      )
      .then(desembrulhar),

  desmarcar: (placeId: string, turmaId: string, matriculaId: string, competencia: string) =>
    api
      .delete<ApiEnvelope<unknown>>(
        `/places/${placeId}/turmas/${turmaId}/mensalidades/${matriculaId}?competencia=${competencia}`,
      )
      .then(desembrulhar),
}
