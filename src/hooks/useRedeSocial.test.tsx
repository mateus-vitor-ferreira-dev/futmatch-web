/**
 * O que o hook da rede protege (web#375, api#387).
 *
 * O teste que carrega o arquivo é o da **diferença entre seguir e ser amigo**.
 * Amigo é sempre alguém que eu sigo, e é fácil escrever um `ehAmigo` que
 * responde a partir da lista errada — a de "seguindo" — e passa despercebido,
 * porque nos dois casos a resposta é verdadeira para os mútuos. Só quem eu sigo
 * **sem** volta separa as duas implementações, e é por isso que a Bia existe
 * aqui.
 *
 * O segundo é o da invalidação. Seguir alguém muda a lista da pessoa também, e
 * esquecer disso deixa o contador do perfil velho na única tela em que alguém
 * está olhando — a que acabou de receber o toque.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { renderHook, waitFor, act } from '../test/render'
import { followsService } from '../services/follows'
import { chaves } from '../lib/queryClient'
import { useRedeSocial } from './useRedeSocial'
import type { PessoaDaRede } from '../types/api'

vi.mock('../services/follows')

const auth = vi.hoisted(() => ({ estado: { user: { id: 'eu' } } }))
vi.mock('../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))

const servico = vi.mocked(followsService)

const pessoa = (id: string, name: string): PessoaDaRede => ({
  id,
  name,
  nickname: null,
  avatarUrl: null,
  badge: null,
  desde: '2026-08-01T00:00:00.000Z',
})

const ANA = pessoa('ana', 'Ana')
const BIA = pessoa('bia', 'Bia')

const cliente = () => new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })

beforeEach(() => {
  vi.clearAllMocks()
  auth.estado = { user: { id: 'eu' } }
  // Sigo as duas; só a Ana me segue de volta.
  servico.seguindo.mockResolvedValue([ANA, BIA])
  servico.meusAmigos.mockResolvedValue([ANA])
  servico.seguir.mockResolvedValue({ id: 'follow-1' })
  servico.deixarDeSeguir.mockResolvedValue({ desfeito: true })
})

describe('useRedeSocial', () => {
  it('separa quem eu sigo de quem é meu amigo', async () => {
    const { result } = renderHook(() => useRedeSocial(), { queryClient: cliente() })

    await waitFor(() => expect(result.current.carregando).toBe(false))

    expect(result.current.sigo('ana')).toBe(true)
    expect(result.current.sigo('bia')).toBe(true)

    expect(result.current.ehAmigo('ana')).toBe(true)
    // O caso que separa as duas implementações: eu sigo a Bia, e ela não me
    // segue de volta. Um `ehAmigo` lendo a lista de "seguindo" diria true.
    expect(result.current.ehAmigo('bia')).toBe(false)
  })

  it('não consulta nada sem sessão', async () => {
    auth.estado = { user: null } as unknown as typeof auth.estado

    renderHook(() => useRedeSocial(), { queryClient: cliente() })

    await waitFor(() => expect(servico.seguindo).not.toHaveBeenCalled())
    expect(servico.meusAmigos).not.toHaveBeenCalled()
  })

  it('ao seguir, invalida também a lista de seguidores da pessoa', async () => {
    const qc = cliente()
    const invalidar = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useRedeSocial(), { queryClient: qc })
    await waitFor(() => expect(result.current.carregando).toBe(false))

    await act(async () => {
      result.current.seguir('carla')
    })

    await waitFor(() => expect(servico.seguir).toHaveBeenCalledWith('carla'))

    const chavesInvalidadas = invalidar.mock.calls.map(([arg]) => JSON.stringify(arg?.queryKey))
    expect(chavesInvalidadas).toContain(JSON.stringify(chaves.rede.seguidores('carla')))
    expect(chavesInvalidadas).toContain(JSON.stringify(chaves.rede.meusAmigos()))
    expect(chavesInvalidadas).toContain(JSON.stringify(chaves.rede.seguindo('eu')))
  })

  it('marca como em alteração só a pessoa que está sendo alterada', async () => {
    // Promessa que não resolve: o estado de "alterando" fica visível.
    servico.seguir.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useRedeSocial(), { queryClient: cliente() })
    await waitFor(() => expect(result.current.carregando).toBe(false))

    act(() => {
      result.current.seguir('carla')
    })

    await waitFor(() => expect(result.current.alterando('carla')).toBe(true))
    expect(result.current.alterando('ana')).toBe(false)
  })
})
