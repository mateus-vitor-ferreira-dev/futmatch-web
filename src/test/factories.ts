/**
 * Fábricas de dados para teste.
 *
 * Um `Partida` completo tem 13 campos e três objetos aninhados. Montar isso à
 * mão em cada teste enterra o que o teste está de fato verificando debaixo de
 * literal — e, quando o tipo muda, quebra em vinte lugares.
 *
 * Regra de uso: passe SÓ o que o teste afirma. `criaPartida({ maxPlayers: 10 })`
 * deixa explícito que o número de vagas é o assunto e o resto é cenário.
 */
import { AxiosError } from 'axios'
import type { AxiosResponse } from 'axios'
import type {
  DrawPlayer,
  DrawResult,
  Partida,
  PartidaParticipant,
  PartidaSearchResult,
  UserMe,
  ApiEnvelope,
  Team,
  TeamInvite,
  TeamPartida,
  TeamPlayer,
  TeamSummary,
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

export function criaParticipante(over: Partial<PartidaParticipant> = {}): PartidaParticipant {
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

export function criaPartida(over: Partial<Partida> = {}): Partida {
  const participations = over.participations ?? []
  return {
    id: 'partida-1',
    date: DATA_FUTURA,
    // Uma hora depois do início — o mesmo padrão da api (#445). Quem testa o
    // horário mostrado sobrescreve pelo `over`.
    endsAt: new Date(new Date(DATA_FUTURA).getTime() + 3_600_000).toISOString(),
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
        // Coordenadas de verdade, de Lavras/MG: a api as manda na busca desde
        // a #216, e é delas que o mapa da busca tira o pino de cada partida.
        latitude: -21.2456,
        longitude: -44.9976,
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
export function criaBuscaDePartidas(
  events: Partida[],
  over: Partial<PartidaSearchResult> = {},
): ApiEnvelope<PartidaSearchResult> {
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
    matchId: 'minha-partida',
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

/** Um jogador no recorte que o time mostra: identidade e selo, nunca contato. */
export function criaJogadorDeTime(over: Partial<TeamPlayer> = {}): TeamPlayer {
  return {
    id: 'user-1',
    name: 'Jogador Teste',
    nickname: null,
    avatarUrl: null,
    badge: null,
    ...over,
  }
}

export function criaTime(over: Partial<Team> = {}): Team {
  const capitao = over.captain ?? criaJogadorDeTime({ id: 'capitao-1', name: 'Capitão' })
  return {
    id: 'time-1',
    name: 'Os Boleiros',
    sport: 'FUTSAL',
    city: 'Campinas',
    captainId: capitao.id,
    captain: capitao,
    members: [{ id: 'membro-do-capitao', userId: capitao.id, joinedAt: DATA_FUTURA, user: capitao }],
    createdAt: DATA_FUTURA,
    updatedAt: DATA_FUTURA,
    ...over,
  }
}

/** O time como a listagem o traz: sem membros, com a contagem. */
export function criaResumoDeTime(over: Partial<TeamSummary> = {}): TeamSummary {
  const capitao = over.captain ?? criaJogadorDeTime({ id: 'capitao-1', name: 'Capitão' })
  return {
    id: 'time-1',
    name: 'Os Boleiros',
    sport: 'FUTSAL',
    city: 'Campinas',
    captainId: capitao.id,
    captain: capitao,
    _count: { members: 3 },
    createdAt: DATA_FUTURA,
    ...over,
  }
}

export function criaPartidaDeTime(over: Partial<TeamPartida> = {}): TeamPartida {
  return {
    id: 'partida-do-time-1',
    date: DATA_FUTURA,
    status: 'WAITING',
    maxPlayers: 14,
    priorityUntil: null,
    court: {
      id: 'quadra-1',
      name: 'Quadra 1',
      type: 'FUTSAL',
      place: { id: 'local-1', name: 'Arena Teste', city: 'Campinas', neighborhood: 'Centro' },
    },
    _count: { participations: 5 },
    ...over,
  }
}

/**
 * Um convite em aberto. `expired` vem da api, e por isso é campo da fixture —
 * derivá-lo de `expiresAt` aqui repetiria no teste a conta que o servidor faz.
 */
export function criaConviteDeTime(over: Partial<TeamInvite> = {}): TeamInvite {
  const quemConvidou = over.invitedBy ?? criaJogadorDeTime({ id: 'capitao-1', name: 'Alex Souza' })
  return {
    id: 'convite-1',
    teamId: 'time-1',
    invitedUserId: 'user-1',
    invitedById: quemConvidou.id,
    status: 'PENDING',
    expiresAt: DATA_FUTURA,
    respondedAt: null,
    createdAt: '2027-03-01T10:00:00.000Z',
    expired: false,
    team: {
      id: 'time-1',
      name: 'Os Boleiros',
      sport: 'FUTSAL',
      city: 'Campinas',
      captain: quemConvidou,
    },
    invitedBy: quemConvidou,
    ...over,
  }
}
