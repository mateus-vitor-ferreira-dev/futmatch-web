import api from './api'
import type { ApiEnvelope, Aula, ChamadaDaAula } from '../types/api'

const desembrulhar = <T>(r: { data: ApiEnvelope<T> }): T => r.data.data

export const aulasService = {
  listar: (placeId: string, turmaId: string, de: string, ate: string) =>
    api.get<ApiEnvelope<Aula[]>>('/places/' + placeId + '/aulas', { params: { turmaId, de, ate } }).then(desembrulhar),
  chamada: (placeId: string, aulaId: string) =>
    api.get<ApiEnvelope<ChamadaDaAula>>(`/places/${placeId}/aulas/${aulaId}/chamada`).then(desembrulhar),
  registrar: (placeId: string, aulaId: string, marcacoes: Array<{ matriculaId: string; presente: boolean }>) =>
    api.put<ApiEnvelope<ChamadaDaAula>>(`/places/${placeId}/aulas/${aulaId}/chamada`, { marcacoes }).then(desembrulhar),
}
