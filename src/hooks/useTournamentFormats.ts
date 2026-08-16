import { useQuery } from '@tanstack/react-query'
import { getTournamentFormats } from '../services/sports'
import { chaves } from '../lib/queryClient'
import type { TournamentFormatInfo } from '../types/api'

/**
 * Fallback para quando a API não responde.
 *
 * ⚠️ Ele é **conservador de propósito**, e essa é a diferença dele para o
 * `FALLBACK_SPORTS` do `useSports`.
 *
 * Lá, um fallback desatualizado faz aparecer uma aba a mais no filtro — chato e
 * inofensivo. Aqui, um fallback permissivo deixaria o dono criar um campeonato
 * num formato que a API vai recusar, ou pior, num formato que ela aceita e o
 * sistema não conduz. Então, sem resposta da API, só sobra o que se sabe que
 * funciona.
 *
 * Os rótulos dos não-implementados existem porque campeonatos antigos precisam
 * ser **exibidos** com o nome certo, mesmo sem poderem ser criados.
 */
const FALLBACK_FORMATS: TournamentFormatInfo[] = [
  { id: 'KNOCKOUT',            label: 'Eliminatório Simples', description: 'Mata-mata: quem perde está fora.',                   implemented: true },
  { id: 'LEAGUE',              label: 'Pontos Corridos',      description: 'Todos jogam entre si e acumulam pontos na tabela.',  implemented: false },
  { id: 'GROUPS_AND_KNOCKOUT', label: 'Grupos + Eliminatório', description: 'Fase de grupos seguida de mata-mata.',              implemented: false },
  { id: 'DOUBLE_ELIMINATION',  label: 'Dupla Eliminação',     description: 'Só está fora quem perde duas vezes.',                implemented: false },
  { id: 'SWISS',               label: 'Sistema Suíço',        description: 'Rodadas emparelhando quem tem pontuação parecida.',  implemented: false },
]

export interface UseTournamentFormats {
  /** Todos os formatos do enum. Use para **exibir** o rótulo de um campeonato. */
  todos: TournamentFormatInfo[]
  /** Só os que o sistema conduz. Use para **oferecer escolha** ao usuário. */
  disponiveis: TournamentFormatInfo[]
  /** Rótulo de um formato qualquer, inclusive os que não podem mais ser criados. */
  rotulo: (id: string) => string
  loading: boolean
}

/**
 * Catálogo de formatos de campeonato, vindo da API.
 *
 * A separação entre `todos` e `disponiveis` é o ponto deste hook, e espelha o
 * que a API faz: a restrição é na escrita, não na leitura. Um campeonato
 * gravado como `LEAGUE` antes da api#263 continua existindo e precisa aparecer
 * com o nome certo na lista — o que não pode é alguém criar outro.
 *
 * `staleTime` de uma hora, como o `useSports`: formato é dado de catálogo, muda
 * quando alguém faz deploy e não durante a sessão.
 */
export function useTournamentFormats(): UseTournamentFormats {
  const { data, isPending } = useQuery({
    queryKey: chaves.formatosDeCampeonato,
    queryFn: getTournamentFormats,
    staleTime: 60 * 60_000,
    // Como no useSports: o fallback já cobre a API fora do ar, e o retry global
    // só atrasaria a tela para no fim mostrar a mesma lista.
    retry: false,
  })

  const recebidos = Array.isArray(data) ? data : []
  const todos = recebidos.length > 0 ? recebidos : FALLBACK_FORMATS
  const disponiveis = todos.filter((f) => f.implemented)

  const rotulo = (id: string) => todos.find((f) => f.id === id)?.label ?? id

  return { todos, disponiveis, rotulo, loading: isPending }
}
