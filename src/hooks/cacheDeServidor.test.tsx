/**
 * Regressão da #198.
 *
 * Antes não havia cache de estado de servidor: cada página buscava tudo do zero
 * na montagem. Medido em build de produção, três visitas seguidas à Home
 * custavam 200 / 202 / 200 ms a 180 ms de RTT — constante morto, porque o dado
 * que tinha chegado segundos antes era descartado.
 *
 * O que estes testes prendem é o contrato do cache, não a implementação:
 * quantas vezes a API é realmente chamada.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { renderWithProviders, screen, waitFor } from '../test/render'
import { useSports } from './useSports'

vi.mock('../services/sports')
import { getSports } from '../services/sports'

const buscaModalidades = vi.mocked(getSports)

const MODALIDADES = [
  { id: 'FUTSAL' as const, label: 'Futsal', icon: 'futsal', iconFallback: '👟', group: 'FUTEBOL', groupLabel: 'Futebol', groupIcon: 'futebol', groupIconFallback: '⚽', groupOrder: 1, description: '' },
]

/**
 * Cliente compartilhado entre montagens, que é o que o app tem de verdade.
 *
 * O `staleTime` daqui não governa `useSports`: o hook fixa uma hora na própria
 * query, porque modalidade é catálogo. Quem manda no frescor é a query, não o
 * cliente — daí o teste de invalidação abaixo, que é o único jeito de forçar
 * uma nova busca.
 */
function clienteComCache() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

function Consumidor({ nome }: { nome: string }) {
  const { sports, loading } = useSports()
  return <span>{loading ? `${nome}: carregando` : `${nome}: ${sports.length}`}</span>
}

beforeEach(() => {
  vi.clearAllMocks()
  buscaModalidades.mockResolvedValue(MODALIDADES)
})

describe('cache de modalidades', () => {
  it('faz uma requisição só, mesmo com vários componentes pedindo', async () => {
    // useSports é chamado em dezoito lugares do app — páginas, PartidasPerto,
    // SportSelect. Com useEffect, cada um disparava o próprio GET /sports.
    renderWithProviders(
      <>
        <Consumidor nome="a" />
        <Consumidor nome="b" />
        <Consumidor nome="c" />
      </>,
      { queryClient: clienteComCache() },
    )

    await waitFor(() => expect(screen.getByText('a: 1')).toBeInTheDocument())
    expect(screen.getByText('b: 1')).toBeInTheDocument()
    expect(screen.getByText('c: 1')).toBeInTheDocument()

    expect(buscaModalidades).toHaveBeenCalledTimes(1)
  })

  it('não busca de novo quando o componente remonta dentro da janela de frescor', async () => {
    const queryClient = clienteComCache()

    const primeira = renderWithProviders(<Consumidor nome="a" />, { queryClient })
    await waitFor(() => expect(screen.getByText('a: 1')).toBeInTheDocument())
    expect(buscaModalidades).toHaveBeenCalledTimes(1)

    // Equivale a sair da página e voltar: componente novo, mesmo cliente.
    primeira.unmount()
    renderWithProviders(<Consumidor nome="b" />, { queryClient })

    // Sem cache isto mostraria "carregando" antes do número. Com cache, o dado
    // já está lá no primeiro render.
    expect(screen.getByText('b: 1')).toBeInTheDocument()
    expect(buscaModalidades).toHaveBeenCalledTimes(1)
  })

  it('busca de novo quando a query é invalidada', async () => {
    // É assim que uma mutação atualiza a tela: invalida a chave e o
    // react-query refaz a busca. Sem este caminho, cache vira tela velha.
    const queryClient = clienteComCache()

    renderWithProviders(<Consumidor nome="a" />, { queryClient })
    await waitFor(() => expect(screen.getByText('a: 1')).toBeInTheDocument())
    expect(buscaModalidades).toHaveBeenCalledTimes(1)

    await queryClient.invalidateQueries({ queryKey: ['modalidades'] })

    await waitFor(() => expect(buscaModalidades).toHaveBeenCalledTimes(2))
  })
})
