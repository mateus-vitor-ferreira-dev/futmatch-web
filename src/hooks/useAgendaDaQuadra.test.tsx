/**
 * O que o hook da agenda protege (web#368).
 *
 * O teste que carrega o arquivo é o terceiro: **mudar só a hora não é
 * requisição nova.** A agenda é do dia, e a tela muda a cada tecla — sem o
 * cache por (quadra, dia), arrastar o horário de 19h para 20h dispararia uma
 * consulta por dígito digitado.
 *
 * O segundo mais importante é o do erro. Ao contrário do
 * `useAlcanceDosRequisitos`, que falha em silêncio de propósito, aqui o erro
 * precisa **sair no retorno**: agenda que não carregou é a tela deixando de
 * barrar horário ocupado, e uma lista vazia diria "está livre", que é a única
 * coisa que ela não pode afirmar.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { renderHook, waitFor } from '../test/render'
import { getAgendaDaQuadra } from '../services/courts'
import { useAgendaDaQuadra } from './useAgendaDaQuadra'

vi.mock('../services/courts')

const buscar = vi.mocked(getAgendaDaQuadra)

const OCUPACAO = {
  tipo: 'PARTIDA' as const,
  id: 'partida-1',
  inicio: '2026-09-01T22:00:00.000Z',
  fim: '2026-09-01T23:00:00.000Z',
  descricao: 'partida de Ana',
}

/** Sem repetição: o teste de erro esperaria os backoffs do react-query. */
const clienteSemRetentativa = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } })

const renderiza = (courtId: string | undefined, data: string | undefined) =>
  renderHook(() => useAgendaDaQuadra(courtId, data), { queryClient: clienteSemRetentativa() })

beforeEach(() => {
  vi.clearAllMocks()
  buscar.mockResolvedValue({
    success: true,
    data: { courtId: 'quadra-1', de: '', ate: '', ocupacoes: [OCUPACAO] },
  })
})

describe('quando ela é pedida', () => {
  it('busca a agenda do dia da data escolhida', async () => {
    const { result } = renderiza('quadra-1', '2026-09-01T19:00')

    await waitFor(() => expect(result.current.ocupacoes).toHaveLength(1))
    expect(buscar).toHaveBeenCalledTimes(1)

    const [courtId, de, ate] = buscar.mock.calls[0]
    expect(courtId).toBe('quadra-1')
    // A janela é o dia inteiro, e começa à meia-noite **local**.
    expect(new Date(de).getHours()).toBe(0)
    expect(new Date(ate).getTime() - new Date(de).getTime()).toBe(24 * 60 * 60 * 1000)
  })

  it('não pede nada sem quadra escolhida', async () => {
    const { result } = renderiza(undefined, '2026-09-01T19:00')

    expect(buscar).not.toHaveBeenCalled()
    expect(result.current.carregando).toBe(false)
    expect(result.current.ocupacoes).toEqual([])
  })

  it('não pede nada sem data, nem com data inválida', async () => {
    renderiza('quadra-1', undefined)
    renderiza('quadra-1', 'ontem de manhã')

    expect(buscar).not.toHaveBeenCalled()
  })

  /**
   * O teste que sustenta o desenho: a chave de cache é (quadra, dia), e não
   * (quadra, instante). Mexer na hora dentro do mesmo dia não é agenda nova.
   */
  it('mudar só a hora, no mesmo dia, não dispara outra busca', async () => {
    const queryClient = clienteSemRetentativa()
    const { result, rerender } = renderHook(
      ({ data }: { data: string }) => useAgendaDaQuadra('quadra-1', data),
      { queryClient, initialProps: { data: '2026-09-01T19:00' } },
    )

    await waitFor(() => expect(result.current.ocupacoes).toHaveLength(1))
    expect(buscar).toHaveBeenCalledTimes(1)

    rerender({ data: '2026-09-01T20:00' })
    rerender({ data: '2026-09-01T21:30' })

    await waitFor(() => expect(result.current.ocupacoes).toHaveLength(1))
    expect(buscar).toHaveBeenCalledTimes(1)
  })

  it('mudar de dia busca de novo', async () => {
    const queryClient = clienteSemRetentativa()
    const { result, rerender } = renderHook(
      ({ data }: { data: string }) => useAgendaDaQuadra('quadra-1', data),
      { queryClient, initialProps: { data: '2026-09-01T19:00' } },
    )

    await waitFor(() => expect(buscar).toHaveBeenCalledTimes(1))

    rerender({ data: '2026-09-02T19:00' })

    await waitFor(() => expect(buscar).toHaveBeenCalledTimes(2))
    expect(result.current.erro).toBe(false)
  })
})

describe('quando ela não carrega', () => {
  /**
   * O oposto do alcance, e de propósito: silêncio aqui deixaria a pessoa
   * achando que a quadra está livre.
   */
  it('marca erro em vez de devolver lista vazia em silêncio', async () => {
    buscar.mockRejectedValue(new Error('rede'))

    const { result } = renderiza('quadra-1', '2026-09-01T19:00')

    await waitFor(() => expect(result.current.erro).toBe(true))
    expect(result.current.ocupacoes).toEqual([])
    expect(result.current.carregando).toBe(false)
  })

  it('resposta sem ocupações é lista vazia, e não erro', async () => {
    buscar.mockResolvedValue({
      success: true,
      data: { courtId: 'quadra-1', de: '', ate: '', ocupacoes: [] },
    })

    const { result } = renderiza('quadra-1', '2026-09-01T19:00')

    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.erro).toBe(false)
    expect(result.current.ocupacoes).toEqual([])
  })
})
