import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { followsService } from '../services/follows'
import { chaves } from '../lib/queryClient'
import { useAuth } from '../contexts/AuthContext'
import type { PessoaDaRede } from '../types/api'

/**
 * A rede de quem está logado — quem eu sigo, e quem é meu amigo (api#387).
 *
 * ## Por que o estado do botão vem daqui, e não do perfil da pessoa
 *
 * `GET /users/:userId` devolve o perfil público e **não diz** se quem está
 * olhando já segue. Perguntar isso por pessoa exigiria uma rota que não existe;
 * o que existe são as duas listas do próprio usuário, que respondem para todo
 * mundo de uma vez.
 *
 * Na prática é melhor do que a rota por pessoa seria: uma partida com doze
 * participantes na tela custaria doze requisições de "eu sigo este?", e aqui
 * custa duas para a sessão inteira.
 *
 * ## Os dois conjuntos, e por que não dá para derivar um do outro
 *
 * `sigo` é assimétrico; `amigos` é a interseção com quem me segue de volta.
 * Amigo é sempre um subconjunto de quem eu sigo, mas o contrário não vale — e é
 * justamente a diferença entre os dois que a tela precisa mostrar, porque é ela
 * que separa as duas regras do portão.
 */
export interface RedeSocial {
  /** Já sigo esta pessoa? */
  sigo: (userId: string) => boolean
  /** Somos amigos — eu sigo e sou seguido de volta? */
  ehAmigo: (userId: string) => boolean
  seguir: (userId: string) => void
  deixarDeSeguir: (userId: string) => void
  /** `true` enquanto a alteração daquela pessoa não voltou da api. */
  alterando: (userId: string) => boolean
  carregando: boolean
  amigos: PessoaDaRede[]
  seguindo: PessoaDaRede[]
}

const VAZIO: PessoaDaRede[] = []

export function useRedeSocial(): RedeSocial {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const eu = user?.id

  const consultaSeguindo = useQuery({
    queryKey: chaves.rede.seguindo(eu ?? ''),
    queryFn: () => followsService.seguindo(eu!),
    enabled: Boolean(eu),
  })

  const consultaAmigos = useQuery({
    queryKey: chaves.rede.meusAmigos(),
    queryFn: () => followsService.meusAmigos(),
    enabled: Boolean(eu),
  })

  const seguindo = consultaSeguindo.data ?? VAZIO
  const amigos = consultaAmigos.data ?? VAZIO

  /**
   * Invalida as duas listas minhas **e** as da pessoa afetada.
   *
   * Seguir alguém muda quatro coisas: meu "seguindo", meus "amigos" — se ela já
   * me seguia, virou amizade —, os "seguidores" dela e, pelo mesmo motivo, o
   * "seguindo" dela não muda mas a contagem que a tela dela mostra sim. Deixar
   * de fora a lista da pessoa faria o contador ficar velho na tela em que o
   * toque acabou de acontecer, que é a única em que alguém repara.
   */
  const invalidar = useCallback(
    (userId: string) => {
      void queryClient.invalidateQueries({ queryKey: chaves.rede.seguindo(eu ?? '') })
      void queryClient.invalidateQueries({ queryKey: chaves.rede.meusAmigos() })
      void queryClient.invalidateQueries({ queryKey: chaves.rede.seguidores(userId) })
    },
    [queryClient, eu],
  )

  const mutacaoSeguir = useMutation({
    mutationFn: (userId: string) => followsService.seguir(userId),
    onSuccess: (_dados, userId) => invalidar(userId),
  })

  const mutacaoDeixar = useMutation({
    mutationFn: (userId: string) => followsService.deixarDeSeguir(userId),
    onSuccess: (_dados, userId) => invalidar(userId),
  })

  const sigo = useCallback((userId: string) => seguindo.some((p) => p.id === userId), [seguindo])
  const ehAmigo = useCallback((userId: string) => amigos.some((p) => p.id === userId), [amigos])

  const alterando = useCallback(
    (userId: string) =>
      (mutacaoSeguir.isPending && mutacaoSeguir.variables === userId) ||
      (mutacaoDeixar.isPending && mutacaoDeixar.variables === userId),
    [mutacaoSeguir.isPending, mutacaoSeguir.variables, mutacaoDeixar.isPending, mutacaoDeixar.variables],
  )

  return {
    sigo,
    ehAmigo,
    seguir: mutacaoSeguir.mutate,
    deixarDeSeguir: mutacaoDeixar.mutate,
    alterando,
    carregando: Boolean(eu) && (consultaSeguindo.isPending || consultaAmigos.isPending),
    amigos,
    seguindo,
  }
}
