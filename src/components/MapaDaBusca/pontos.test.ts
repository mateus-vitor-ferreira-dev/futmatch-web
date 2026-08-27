/**
 * O que vira pino, e o que não vira.
 *
 * A conversão parece trivial e tem uma decisão dentro: **partida sem coordenada
 * é descartada, não desenhada**. `latitude` e `longitude` chegam nulas enquanto
 * o geocoder não resolve o endereço do espaço, e um `?? 0` inocente poria a
 * pelada no Golfo da Guiné — a 5.000 km de qualquer raio, num mapa que a pessoa
 * abriu para ver o que está perto.
 *
 * É também o único pedaço do mapa que dá para testar sem Leaflet: o componente
 * precisa de layout de verdade, e o resto do contrato — quando o mapa aparece e
 * com o quê — é conferido na tela de busca.
 */

import { describe, it, expect } from 'vitest'
import { criaPartida } from '../../test/factories'
import { pontosDaBusca } from './pontos'

const comLocal = (over: Partial<{ latitude: number | null; longitude: number | null; name: string }>) => {
  const base = criaPartida()
  return criaPartida({
    court: { ...base.court!, place: { ...base.court!.place, ...over } },
  })
}

describe('os pontos que o mapa desenha', () => {
  it('converte a partida que tem coordenada', () => {
    const pontos = pontosDaBusca([comLocal({ latitude: -21.24, longitude: -44.99, name: 'Arena Sul' })])

    expect(pontos).toHaveLength(1)
    expect(pontos[0]).toMatchObject({ latitude: -21.24, longitude: -44.99, titulo: 'Arena Sul' })
  })

  /**
   * O caso que justifica a função existir. Espaço sem geocodificação tem as
   * duas nulas, e o mapa não pode inventar um lugar para ele.
   */
  it('descarta a partida cujo espaço ainda não foi geocodificado', () => {
    expect(pontosDaBusca([comLocal({ latitude: null, longitude: null })])).toEqual([])
  })

  it('descarta também quando só uma das duas veio', () => {
    expect(pontosDaBusca([comLocal({ latitude: -21.24, longitude: null })])).toEqual([])
    expect(pontosDaBusca([comLocal({ latitude: null, longitude: -44.99 })])).toEqual([])
  })

  it('não deixa o descarte derrubar as outras', () => {
    const pontos = pontosDaBusca([
      comLocal({ latitude: null, longitude: null }),
      comLocal({ latitude: -21.24, longitude: -44.99, name: 'Arena Sul' }),
    ])

    expect(pontos).toHaveLength(1)
    expect(pontos[0]!.titulo).toBe('Arena Sul')
  })

  it('o detalhe do pino diz quadra e quando é', () => {
    const [ponto] = pontosDaBusca([comLocal({ latitude: -21.24, longitude: -44.99 })])

    expect(ponto!.detalhe).toContain('Quadra 1')
    expect(ponto!.detalhe).toMatch(/\d{2}:\d{2}/)
  })
})
