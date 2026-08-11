import { useQuery } from '@tanstack/react-query'
import { getPublicStats } from '../services/stats'
import type { NumerosPublicos } from '../services/stats'
import { chaves } from '../lib/queryClient'

/**
 * Cinco minutos, o mesmo que a API cacheia em `stats.service.ts`.
 *
 * Buscar mais vezes que isso só rende a mesma resposta de novo: o `staleTime`
 * padrão de um minuto faria três refetches inúteis dentro de uma janela de
 * cache do servidor.
 */
const FRESCOR_MS = 5 * 60 * 1000

/**
 * Números públicos da plataforma para a tela de autenticação.
 *
 * Devolve `null` enquanto carrega e quando a API não responde — nunca zeros.
 * Zero é um número, e um número errado: quem chama esconde o cartão em vez de
 * exibir dado vazio, e a tela de login continua de pé sem a API.
 */
export function useEstatisticas(): { numeros: NumerosPublicos | null } {
  const { data } = useQuery({
    queryKey: chaves.estatisticas(),
    queryFn: getPublicStats,
    staleTime: FRESCOR_MS,
  })

  return { numeros: data ?? null }
}
