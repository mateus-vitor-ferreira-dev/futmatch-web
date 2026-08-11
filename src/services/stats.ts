import api from './api'
import type { ApiEnvelope } from '../types/api'

/**
 * Números agregados da plataforma, contados no banco pela API.
 *
 * Endpoint público, não requer auth — a mesma `GET /stats` que alimenta a
 * prova social da landing (`so-mais-um-landing/src/lib/stats.ts`).
 */
export interface NumerosPublicos {
  jogadores: number
  peladasAbertas: number
  cidades: number
  arenas: number
}

function ehNumerosPublicos(valor: unknown): valor is NumerosPublicos {
  const dados = valor as Partial<NumerosPublicos> | null | undefined

  return (
    typeof dados?.jogadores === 'number' &&
    typeof dados?.peladasAbertas === 'number' &&
    typeof dados?.cidades === 'number' &&
    typeof dados?.arenas === 'number'
  )
}

/**
 * Como `getSports`, devolve o conteúdo já DESEMBRULHADO (`data.data`).
 *
 * Campo faltando estoura de propósito: quem chama trata a falha escondendo os
 * cartões, e isso é melhor do que renderizar `undefined` formatado como
 * número. Zero também não serve de substituto — ver `useEstatisticas`.
 */
export const getPublicStats = (): Promise<NumerosPublicos> =>
  api.get<ApiEnvelope<NumerosPublicos>>('/stats').then((r) => {
    if (!ehNumerosPublicos(r.data?.data)) {
      throw new Error('GET /stats devolveu resposta sem os números esperados')
    }
    return r.data.data
  })
