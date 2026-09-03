/**
 * As contas da agenda (web#368).
 *
 * Duas delas carregam a issue inteira, e nenhuma é óbvia:
 *
 * 1. **A janela do dia é local, não UTC.** Quem está em UTC-3 e escolhe 21h de
 *    terça tem `toISOString()` dizendo quarta. Pedir o dia por aí mostraria a
 *    agenda do dia errado justamente no fim da tarde, que é quando quase toda
 *    partida amadora acontece.
 * 2. **Encostar não é sobrepor.** A regra tem de ser a MESMA da api: uma tela
 *    mais rígida recusaria na cara do organizador um horário que o servidor
 *    aceitaria, e ele não teria como saber quem está errado.
 */
import { describe, it, expect } from 'vitest'
import {
  limitesDoDia,
  diaDe,
  fimDaPartida,
  conflitoNaAgenda,
  faixaDeHorario,
  DURACAO_PADRAO_MINUTOS,
} from './agenda'
import type { OcupacaoDaQuadra } from '../types/api'

const ocupacao = (inicio: string, fim: string, resto: Partial<OcupacaoDaQuadra> = {}): OcupacaoDaQuadra => ({
  tipo: 'PARTIDA',
  id: 'partida-1',
  inicio,
  fim,
  descricao: 'partida de Ana',
  ...resto,
})

/** O mesmo instante, escrito como o `datetime-local` escreve: local, sem fuso. */
const local = (dia: string, hora: string) => `${dia}T${hora}`

describe('limitesDoDia', () => {
  it('devolve meia-noite local do dia escolhido, e as 24 horas seguintes', () => {
    const limites = limitesDoDia(local('2026-09-01', '19:00'))

    expect(limites).not.toBeNull()
    const de = new Date(limites!.de)
    const ate = new Date(limites!.ate)
    // Meia-noite **local** — é o que importa, e o ISO dela depende do fuso.
    expect(de.getHours()).toBe(0)
    expect(de.getMinutes()).toBe(0)
    expect(de.getDate()).toBe(1)
    expect(ate.getTime() - de.getTime()).toBe(24 * 60 * 60 * 1000)
  })

  /**
   * O caso que a implementação ingênua erra: em UTC-3, `21:00` de 01/09 vira
   * `2026-09-02T00:00Z`. Cortar o ISO pegaria o dia 2.
   */
  it('a noite não escorrega para o dia seguinte', () => {
    const limites = limitesDoDia(local('2026-09-01', '21:00'))

    expect(new Date(limites!.de).getDate()).toBe(1)
    expect(diaDe(local('2026-09-01', '21:00'))).toBe('2026-09-01')
  })

  it('data inválida devolve null em vez de uma janela inventada', () => {
    expect(limitesDoDia('ontem de manhã')).toBeNull()
    expect(diaDe('')).toBeNull()
  })
})

describe('fimDaPartida', () => {
  it('soma a duração informada', () => {
    const fim = fimDaPartida(local('2026-09-01', '19:00'), 90)
    expect(fim!.getHours()).toBe(20)
    expect(fim!.getMinutes()).toBe(30)
  })

  it('sem duração, assume o padrão da api', () => {
    const inicio = new Date(local('2026-09-01', '19:00'))
    const fim = fimDaPartida(local('2026-09-01', '19:00'), undefined)
    expect(fim!.getTime() - inicio.getTime()).toBe(DURACAO_PADRAO_MINUTOS * 60_000)
  })

  it('duração zero ou negativa cai no padrão, e não em fim antes do início', () => {
    const inicio = new Date(local('2026-09-01', '19:00'))
    for (const invalida of [0, -30]) {
      const fim = fimDaPartida(local('2026-09-01', '19:00'), invalida)
      expect(fim!.getTime()).toBeGreaterThan(inicio.getTime())
    }
  })
})

describe('conflitoNaAgenda', () => {
  const DAS_19_AS_20 = ocupacao(
    new Date(local('2026-09-01', '19:00')).toISOString(),
    new Date(local('2026-09-01', '20:00')).toISOString(),
  )

  it('sobreposição parcial conflita', () => {
    const achado = conflitoNaAgenda(
      [DAS_19_AS_20],
      new Date(local('2026-09-01', '19:30')),
      new Date(local('2026-09-01', '20:30')),
    )
    expect(achado).not.toBeNull()
  })

  it('uma janela que engole a outra conflita', () => {
    const achado = conflitoNaAgenda(
      [DAS_19_AS_20],
      new Date(local('2026-09-01', '18:00')),
      new Date(local('2026-09-01', '22:00')),
    )
    expect(achado).not.toBeNull()
  })

  /** A mesma borda que a api aceita — ver o comentário do módulo. */
  it('começar exatamente quando a outra termina não conflita', () => {
    const achado = conflitoNaAgenda(
      [DAS_19_AS_20],
      new Date(local('2026-09-01', '20:00')),
      new Date(local('2026-09-01', '21:00')),
    )
    expect(achado).toBeNull()
  })

  it('terminar exatamente quando a outra começa não conflita', () => {
    const achado = conflitoNaAgenda(
      [DAS_19_AS_20],
      new Date(local('2026-09-01', '18:00')),
      new Date(local('2026-09-01', '19:00')),
    )
    expect(achado).toBeNull()
  })

  it('agenda vazia não conflita com nada', () => {
    expect(
      conflitoNaAgenda([], new Date(local('2026-09-01', '19:00')), new Date(local('2026-09-01', '20:00'))),
    ).toBeNull()
  })

  it('devolve a ocupação que atropela, para a tela poder nomeá-la', () => {
    const outra = ocupacao(
      new Date(local('2026-09-01', '08:00')).toISOString(),
      new Date(local('2026-09-01', '09:00')).toISOString(),
      { descricao: 'horário reservado', id: null },
    )

    const achado = conflitoNaAgenda(
      [outra, DAS_19_AS_20],
      new Date(local('2026-09-01', '19:30')),
      new Date(local('2026-09-01', '20:30')),
    )

    expect(achado?.descricao).toBe('partida de Ana')
  })
})

describe('faixaDeHorario', () => {
  it('escreve a faixa da marcação', () => {
    const texto = faixaDeHorario(
      ocupacao(
        new Date(local('2026-09-01', '19:00')).toISOString(),
        new Date(local('2026-09-01', '20:00')).toISOString(),
      ),
    )
    expect(texto).toBe('das 19:00 às 20:00')
  })

  /**
   * O teste que este substitui afirmava o contrário: que o jogo de campeonato
   * saía com "(fim estimado)". Ele passava fabricando `fimPresumido: true` na
   * própria fixture, então nunca dependeu da api — e continuaria verde depois
   * de a api#453 parar de mandar o campo, guardando um caminho morto.
   *
   * Este afirma o que passou a valer, e é o que impede o sufixo de voltar de
   * carona num merge.
   */
  it('não ressalva o jogo de campeonato: o fim dele é informado', () => {
    const texto = faixaDeHorario(
      ocupacao(
        new Date(local('2026-09-01', '19:00')).toISOString(),
        new Date(local('2026-09-01', '21:00')).toISOString(),
        { tipo: 'PARTIDA_DE_CAMPEONATO', descricao: '2ª rodada, jogo 3' },
      ),
    )
    expect(texto).toBe('das 19:00 às 21:00')
    expect(texto).not.toContain('estimado')
  })

  /** A aula entrou na agenda na api#473, e sai pela mesma régua. */
  it('escreve a faixa da aula sem ressalva', () => {
    const texto = faixaDeHorario(
      ocupacao(
        new Date(local('2026-09-01', '19:00')).toISOString(),
        new Date(local('2026-09-01', '20:30')).toISOString(),
        { tipo: 'AULA', descricao: 'aula de Beach Tennis' },
      ),
    )
    expect(texto).toBe('das 19:00 às 20:30')
  })
})
