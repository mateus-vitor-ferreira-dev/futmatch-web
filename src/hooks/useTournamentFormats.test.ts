/**
 * O catálogo de formatos de campeonato.
 *
 * O seletor de formato mantinha a própria lista, com os cinco valores do enum,
 * enquanto a API sabe conduzir um — escolher "Pontos Corridos" criava um
 * campeonato que nunca teria chaveamento, partida nem resultado. Ver api#263.
 *
 * A separação entre `todos` e `disponiveis` é o que este teste protege: a
 * restrição é na escrita, não na leitura. Quem apagar essa distinção some com
 * campeonatos antigos da lista, ou volta a oferecer o que a API recusa.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '../test/render'
import { useTournamentFormats } from './useTournamentFormats'
import type { TournamentFormatInfo } from '../types/api'

vi.mock('../services/sports')

import { getTournamentFormats } from '../services/sports'

const buscaFormatos = vi.mocked(getTournamentFormats)

const DA_API: TournamentFormatInfo[] = [
  { id: 'KNOCKOUT', label: 'Eliminatório Simples', description: 'Mata-mata.', implemented: true },
  { id: 'LEAGUE',   label: 'Pontos Corridos',      description: 'Tabela.',    implemented: false },
  { id: 'SWISS',    label: 'Sistema Suíço',        description: 'Suíço.',     implemented: false },
]

beforeEach(() => {
  vi.clearAllMocks()
  buscaFormatos.mockResolvedValue(DA_API)
})

describe('useTournamentFormats', () => {
  it('oferece para escolha só o que a API marcou como implementado', async () => {
    const { result } = renderHook(() => useTournamentFormats())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.disponiveis.map((f) => f.id)).toEqual(['KNOCKOUT'])
  })

  it('mantém todos os formatos para exibição, inclusive os não implementados', async () => {
    const { result } = renderHook(() => useTournamentFormats())

    await waitFor(() => expect(result.current.loading).toBe(false))

    // Campeonato gravado como LEAGUE antes da restrição continua na lista e
    // precisa aparecer com o nome certo — não pode sumir junto com a proibição.
    expect(result.current.todos).toHaveLength(3)
    expect(result.current.rotulo('LEAGUE')).toBe('Pontos Corridos')
  })

  it('devolve o próprio id quando o formato é desconhecido, em vez de vazio', async () => {
    const { result } = renderHook(() => useTournamentFormats())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.rotulo('FORMATO_DO_FUTURO')).toBe('FORMATO_DO_FUTURO')
  })

  /*
   * O ponto onde este hook difere do `useSports` de propósito.
   *
   * Lá, um fallback desatualizado faz aparecer uma aba a mais no filtro. Aqui,
   * um fallback permissivo deixaria criar campeonato num formato que a API
   * recusa. Com a API fora, só sobra o que se sabe que funciona.
   */
  it('com a API fora, ainda assim não oferece formato não implementado', async () => {
    buscaFormatos.mockRejectedValue(new Error('fora do ar'))

    const { result } = renderHook(() => useTournamentFormats())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.disponiveis.map((f) => f.id)).toEqual(['KNOCKOUT'])
    // E os rótulos dos outros continuam disponíveis para exibir campeonatos antigos.
    expect(result.current.rotulo('SWISS')).toBe('Sistema Suíço')
  })

  it('com a API devolvendo lista vazia, cai no fallback em vez de ficar sem formato', async () => {
    buscaFormatos.mockResolvedValue([])

    const { result } = renderHook(() => useTournamentFormats())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.disponiveis.length).toBeGreaterThan(0)
  })
})
