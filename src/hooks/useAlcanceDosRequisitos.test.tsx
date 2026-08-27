/**
 * O atraso do pedido, e o que ele protege.
 *
 * A tela muda a cada tecla — arrastar o controle de presença de 50% a 90%
 * dispara uma dúzia de mudanças —, e cada uma seria uma requisição que faz
 * quatro consultas no banco. O Swagger da rota pede `debounce` com todas as
 * letras, e este arquivo é o que garante que ele existe.
 *
 * O segundo teste é o menos óbvio e o mais importante: **render do pai não é
 * mudança de requisito**. O componente que hospeda isto guarda o formulário
 * inteiro, então ele re-renderiza a cada tecla de qualquer campo. Sem a
 * assinatura do conteúdo, o temporizador reiniciaria a cada uma dessas
 * renderizações e a estimativa nunca chegaria enquanto alguém digitasse o nome
 * da partida.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '../test/render'
import { playerService } from '../services/playerService'
import type { PartidaRequirement } from '../types/api'
import { useAlcanceDosRequisitos } from './useAlcanceDosRequisitos'

vi.mock('../services/playerService')

const estimar = vi.mocked(playerService.estimarAlcance)

/** Avança o relógio DENTRO do `act`: o timer muda estado, e o React precisa descarregar. */
const avanca = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })

const ALCANCE = { faixa: 'ALGUNS' as const, faixaSemRequisitos: 'MUITOS' as const, raioKm: 10 }
const REGRA: PartidaRequirement[] = [{ type: 'MIN_MATCHES_PLAYED', params: { min: 5 } }]

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  estimar.mockResolvedValue({ success: true, data: ALCANCE })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('o pedido do alcance', () => {
  it('não sai antes do atraso, e sai uma vez depois dele', async () => {
    renderHook(() => useAlcanceDosRequisitos('quadra-1', REGRA))

    expect(estimar).not.toHaveBeenCalled()

    await avanca(500)

    expect(estimar).toHaveBeenCalledTimes(1)
    expect(estimar).toHaveBeenCalledWith('quadra-1', REGRA)
  })

  /**
   * O caso que quase não se vê: o pai re-renderiza por qualquer motivo, com a
   * MESMA lista. Sem a assinatura do conteúdo, cada render reiniciaria a
   * contagem e a estimativa nunca chegaria.
   */
  it('render do pai com a mesma regra não reinicia a espera', async () => {
    const { rerender } = renderHook(() => useAlcanceDosRequisitos('quadra-1', [...REGRA]))

    await avanca(300)
    rerender()
    rerender()
    await avanca(300)

    expect(estimar).toHaveBeenCalledTimes(1)
  })

  it('sem quadra escolhida, não pergunta nada', async () => {
    renderHook(() => useAlcanceDosRequisitos(undefined, REGRA))

    await avanca(1000)

    expect(estimar).not.toHaveBeenCalled()
  })

  it('entrega o alcance que a api devolveu', async () => {
    const { result } = renderHook(() => useAlcanceDosRequisitos('quadra-1', REGRA))

    // Sem `waitFor`: ele conta o tempo com os mesmos temporizadores que estão
    // falsos, e ficaria esperando para sempre. O `advanceTimersByTimeAsync` já
    // esvazia as microtasks da promessa.
    await avanca(500)

    expect(result.current.alcance).toEqual(ALCANCE)
  })

  /**
   * Falhar em silêncio é a decisão certa aqui: sem alcance a tela cai no aviso
   * heurístico, que continua sendo o piso. Um erro vermelho por uma
   * **estimativa** que não carregou tiraria a atenção do que o organizador
   * está de fato fazendo.
   */
  it('api fora do ar não vira erro na tela — fica sem alcance', async () => {
    estimar.mockRejectedValue(new Error('500'))

    const { result } = renderHook(() => useAlcanceDosRequisitos('quadra-1', REGRA))

    await avanca(500)

    expect(result.current.carregando).toBe(false)
    expect(result.current.alcance).toBeNull()
  })
})
