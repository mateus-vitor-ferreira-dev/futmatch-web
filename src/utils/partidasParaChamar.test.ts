/**
 * Quais partidas cabem no "Chamar para jogar" (#380).
 *
 * A regra é curta e mora fora do componente porque é ela que decide se o
 * convite leva a algum lugar — oferecer a partida de terça passada é oferecer
 * um link morto.
 */
import { describe, it, expect } from 'vitest'
import { criaPartida } from '../test/factories'
import { podeReceberGente } from './partidasParaChamar'

const AGORA = new Date('2026-03-01T20:00:00.000Z').getTime()
const emHoras = (h: number) => new Date(AGORA + h * 3_600_000).toISOString()

describe('podeReceberGente', () => {
  it('aceita partida futura com vaga', () => {
    const p = criaPartida({
      date: emHoras(24),
      endsAt: emHoras(26),
      maxPlayers: 10,
      _count: { participations: 4 },
    })

    expect(podeReceberGente(p, AGORA)).toBe(true)
  })

  it('recusa partida lotada', () => {
    const p = criaPartida({
      date: emHoras(24),
      endsAt: emHoras(26),
      maxPlayers: 10,
      _count: { participations: 10 },
    })

    expect(podeReceberGente(p, AGORA)).toBe(false)
  })

  it('recusa partida que já acabou', () => {
    const p = criaPartida({ date: emHoras(-4), endsAt: emHoras(-2), _count: { participations: 2 } })

    expect(podeReceberGente(p, AGORA)).toBe(false)
  })

  /**
   * O corte é pelo **fim**, e não pelo começo. É o atrasado que chega no
   * segundo tempo — e é o caso que o `endsAt` da api#445 tornou possível
   * distinguir.
   */
  it('aceita partida que já começou mas ainda não acabou', () => {
    const p = criaPartida({ date: emHoras(-1), endsAt: emHoras(1), _count: { participations: 4 } })

    expect(podeReceberGente(p, AGORA)).toBe(true)
  })

  it.each(['CANCELLED', 'FINISHED'] as const)('recusa partida %s mesmo com vaga e no futuro', (status) => {
    const p = criaPartida({ status, date: emHoras(24), endsAt: emHoras(26), _count: { participations: 1 } })

    expect(podeReceberGente(p, AGORA)).toBe(false)
  })

  it('trata a contagem ausente como zero, e não como lotada', () => {
    // `_count` é opcional no tipo. Sem esta linha, uma resposta sem ele
    // esconderia todas as partidas do organizador.
    const p = criaPartida({ date: emHoras(24), endsAt: emHoras(26), _count: undefined })

    expect(podeReceberGente(p, AGORA)).toBe(true)
  })
})
