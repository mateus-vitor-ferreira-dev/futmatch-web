/**
 * Fábricas de dados para teste.
 *
 * Um `Pelada` completo tem 13 campos e três objetos aninhados. Montar isso à
 * mão em cada teste enterra o que o teste está de fato verificando debaixo de
 * literal — e, quando o tipo muda, quebra em vinte lugares.
 *
 * Regra de uso: passe SÓ o que o teste afirma. `criaPelada({ maxPlayers: 10 })`
 * deixa explícito que o número de vagas é o assunto e o resto é cenário.
 */
import { AxiosError } from 'axios'
import type { AxiosResponse } from 'axios'
import type {
  DrawPlayer,
  DrawResult,
  Pelada,
  PeladaParticipant,
  PeladaSearchResult,
  UserMe,
  ApiEnvelope,
} from '../types/api'

/** Data fixa e no futuro: teste que depende de "agora" falha sozinho um dia. */
export const DATA_FUTURA = '2027-03-11T19:00:00.000Z'

export function criaUsuario(over: Partial<UserMe> = {}): UserMe {
  return {
    id: 'user-1',
    name: 'Mateus Ferreira',
    nickname: null,
    avatarUrl: null,
    badge: null,
    role: 'PLAYER',
    createdAt: '2026-01-10T12:00:00.000Z',
    email: 'mateus@exemplo.com',
    phone: null,
    pixKey: null,
    marketingOptIn: false,
    ...over,
  }
}

export function criaParticipante(over: Partial<PeladaParticipant> = {}): PeladaParticipant {
  const userId = over.userId ?? 'user-2'
  return {
    userId,
    user: {
      id: userId,
      name: 'Jogador Convidado',
      nickname: null,
      avatarUrl: null,
    },
    ...over,
  }
}

export function criaPelada(over: Partial<Pelada> = {}): Pelada {
  const participations = over.participations ?? []
  return {
    id: 'pelada-1',
    date: DATA_FUTURA,
    status: 'WAITING',
    maxPlayers: 10,
    totalValue: '200.00',
    pixKey: 'chave-pix@exemplo.com',
    courtId: 'quadra-1',
    organizerId: 'user-organizador',
    court: {
      id: 'quadra-1',
      name: 'Quadra 1',
      type: 'SOCIETY',
      place: {
        id: 'local-1',
        name: 'Arena Sul',
        city: 'Lavras',
        neighborhood: 'Centro',
        state: 'MG',
      },
    },
    organizer: { id: 'user-organizador', name: 'Organizador', avatarUrl: null },
    createdAt: '2026-02-01T12:00:00.000Z',
    updatedAt: '2026-02-01T12:00:00.000Z',
    // `_count` é a fonte da contagem de vagas na tela; sem override ele
    // acompanha a lista de participantes, que é o que a API devolve.
    _count: { participations: participations.length },
    ...over,
    participations,
  }
}

/** Envelope `{ success, data }` — o formato que os serviços devolvem. */
export function envelope<T>(data: T): ApiEnvelope<T> {
  return { success: true, data }
}

/** Resposta paginada de `GET /events`, como o QueroJogar espera. */
export function criaBuscaDePeladas(
  events: Pelada[],
  over: Partial<PeladaSearchResult> = {},
): ApiEnvelope<PeladaSearchResult> {
  return envelope({
    events,
    total: events.length,
    page: 1,
    hasMore: false,
    ...over,
  })
}

/**
 * Erro de API como as páginas o recebem.
 *
 * Tem que ser um `AxiosError` de verdade: `mensagemDeErro` decide o que
 * mostrar com `err instanceof AxiosError`, e um objeto literal com o mesmo
 * formato cai no ramo do fallback — o teste passaria a afirmar a mensagem
 * padrão em vez da mensagem da API, sem nunca acusar nada.
 */
export function erroDaApi(message: string, status = 400, code?: string): AxiosError {
  return new AxiosError(
    message,
    String(status),
    undefined,
    undefined,
    {
      status,
      statusText: '',
      // O `code` é opcional porque a maioria das recusas se explica pela
      // mensagem. Quando a tela decide algo pelo código — o `codigoDeErro` do
      // `apiError` —, é ele que o teste precisa mandar, e não o status: dois
      // 403 diferentes levam a telas diferentes.
      data: { success: false, message, ...(code ? { code } : {}) },
      headers: {},
      config: { headers: {} },
    } as unknown as AxiosResponse,
  )
}

/**
 * Resultado de sorteio, com os campos que a api#206 acrescentou já preenchidos.
 *
 * Existe para os testes descreverem só o que lhes interessa — "dois times, um
 * jogador estimado" — sem repetir `mode` e `balance` em cada arquivo. Quando a
 * resposta ganhar campo novo, muda aqui e não em cada teste.
 */
export function criaSorteio(over: Partial<DrawResult> = {}): DrawResult {
  const teams = over.teams ?? [
    { name: 'Time 1', skillIndex: 100, averageSkill: 50, players: [criaJogadorSorteado({ id: 'u1', name: 'Ana' })] },
    { name: 'Time 2', skillIndex: 100, averageSkill: 50, players: [criaJogadorSorteado({ id: 'u2', name: 'Bruno' })] },
  ]

  return {
    peladaId: 'minha-pelada',
    teamCount: teams.length,
    totalPlayers: teams.reduce((s, t) => s + t.players.length, 0),
    mode: 'ALEATORIO',
    teams,
    balance: {
      spread: 0,
      target: 5,
      withinTarget: true,
      estimatedPlayers: teams.flatMap(t => t.players).filter(p => p.skill?.estimado).length,
    },
    ...over,
  }
}

export function criaJogadorSorteado(over: Partial<DrawPlayer> = {}): DrawPlayer {
  return {
    id: 'u1',
    name: 'Jogador',
    avatarUrl: null,
    badge: null,
    position: null,
    skill: { valor: 50, estimado: false },
    ...over,
  }
}
