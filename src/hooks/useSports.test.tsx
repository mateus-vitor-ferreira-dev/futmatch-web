/**
 * O catálogo de modalidades alimenta filtro de busca, cadastro e criação de
 * partida. Quando a API não responde, o hook cai num catálogo local — e é esse
 * caminho que sustenta as três telas em vez de deixá-las vazias.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '../test/render'
import { erroDaApi } from '../test/factories'
import { useSports, getSportMeta } from './useSports'

vi.mock('../services/sports')
import { getSports } from '../services/sports'

const buscaModalidades = vi.mocked(getSports)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useSports', () => {
  it('usa o que a API devolveu', async () => {
    buscaModalidades.mockResolvedValue([
      { id: 'FUTSAL', label: 'Futsal da API', icon: 'futsal', iconFallback: '👟', group: 'FUTEBOL', groupLabel: 'Futebol', groupIcon: 'futebol', groupIconFallback: '⚽', groupOrder: 1, description: '' },
    ])

    const { result } = renderHook(() => useSports())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.sports).toHaveLength(1)
    expect(result.current.sports[0].label).toBe('Futsal da API')
  })

  it('cai no catálogo local quando a API falha', async () => {
    buscaModalidades.mockRejectedValue(erroDaApi('fora do ar', 503))

    const { result } = renderHook(() => useSports())

    await waitFor(() => expect(result.current.loading).toBe(false))
    // As 12 modalidades do produto continuam disponíveis mesmo sem a API.
    expect(result.current.sports).toHaveLength(12)
    expect(result.current.sports.map(s => s.id)).toContain('SOCIETY')
  })

  it('cai no catálogo local quando a API devolve lista vazia', async () => {
    buscaModalidades.mockResolvedValue([])

    const { result } = renderHook(() => useSports())

    await waitFor(() => expect(result.current.loading).toBe(false))
    // Tela de filtro sem nenhuma modalidade é pior que uma lista defasada.
    expect(result.current.sports).toHaveLength(12)
  })

  it('cai no catálogo local quando a resposta vem sem `group`', async () => {
    buscaModalidades.mockResolvedValue([
      { id: 'FUTSAL', label: 'Futsal', icon: '👟' } as never,
    ])

    const { result } = renderHook(() => useSports())

    await waitFor(() => expect(result.current.loading).toBe(false))
    // Sem `group` não dá para montar as abas — o catálogo local tem o campo.
    expect(result.current.sports).toHaveLength(12)
  })

  it('agrupa as modalidades em abas ordenadas', async () => {
    buscaModalidades.mockRejectedValue(erroDaApi('fora do ar', 503))

    const { result } = renderHook(() => useSports())

    await waitFor(() => expect(result.current.loading).toBe(false))
    const ordens = result.current.tabs.map(t => t.order)
    expect(ordens).toEqual([...ordens].sort((a, b) => a - b))
    // Futebol junta Society, Campo e Futsal numa aba só.
    const futebol = result.current.tabs.find(t => t.id === 'FUTEBOL')!
    expect(futebol.types).toEqual(['SOCIETY', 'CAMPO', 'FUTSAL'])
  })
})

describe('getSportMeta', () => {
  it('traduz o enum da API para rótulo e ícone', () => {
    // `toMatchObject`, e não `toEqual`: o tipo de retorno declara só
    // { label, icon }, mas em tempo de execução vem a modalidade inteira do
    // catálogo. O que importa aqui são os dois campos que a tela usa.
    expect(getSportMeta('BEACH_TENNIS')).toMatchObject({
      label: 'Beach Tennis',
      icon: 'beach-tennis',
      iconFallback: '🎾',
    })
  })

  it('devolve o próprio código quando a modalidade é desconhecida', () => {
    // Modalidade nova na API antes de o front saber dela: mostrar o código
    // é feio, mas é melhor que renderizar `undefined` no card.
    expect(getSportMeta('PADEL' as never)).toEqual({
      label: 'PADEL',
      icon: 'society',
      iconFallback: '⚽',
    })
  })
})
