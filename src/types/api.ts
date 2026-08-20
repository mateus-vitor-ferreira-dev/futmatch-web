/**
 * Contratos da API Só+1, espelhando o que o backend devolve.
 *
 * Não há geração automática a partir do schema do Prisma — estes tipos são
 * mantidos à mão e precisam acompanhar mudanças na API. Onde a API expõe um
 * enum, o união literal aqui usa exatamente os mesmos valores.
 */

// ─── Enums (espelham os enums do Prisma no backend) ──────────────────────────

export type UserRole = "PLAYER" | "OWNER" | "ADMIN";
export type UserBadge = "CONFIAVEL" | "CRAQUE" | "ORGANIZADOR_NATO";

export type CourtType =
    | "SOCIETY"
    | "CAMPO"
    | "FUTSAL"
    | "AREIA"
    | "VOLEI"
    | "VOLEI_AREIA"
    | "HANDBALL"
    | "PETECA"
    | "BEACH_TENNIS"
    | "BASQUETE"
    | "TENIS"
    | "POKER";

export type CourtStatus = "OPEN" | "CLOSED";
export type PlaceStatus = "OPEN" | "CLOSED";
export type PeladaStatus = "WAITING" | "FULL" | "FINISHED" | "CANCELLED";
export type PlaceRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ReviewTag =
    | "CRAQUE_DA_PELADA"
    | "JOGA_FACIL"
    | "PASSA_DE_ANO"
    | "PONTUAL"
    | "FAIR_PLAY"
    | "BOA_COMUNICACAO";

export type NotificationType =
    | "PLAYER_JOINED"
    | "PLAYER_LEFT"
    | "PELADA_FULL"
    | "PELADA_CANCELLED"
    | "PELADA_FINISHED"
    | "ATTENDANCE_CONFIRMED";

export type TournamentStatus =
    | "DRAFT"
    | "OPEN"
    | "REGISTRATION_CLOSED"
    | "IN_PROGRESS"
    | "FINISHED"
    | "CANCELLED";

export type TournamentFormat =
    | "LEAGUE"
    | "KNOCKOUT"
    | "GROUPS_AND_KNOCKOUT"
    | "DOUBLE_ELIMINATION"
    | "SWISS";

/**
 * Um formato de campeonato, como `GET /tournament-formats` o devolve.
 *
 * `implemented` é o campo que importa: o enum tem cinco e o sistema sabe
 * conduzir um. A API recusa criar ou editar campeonato num formato com
 * `implemented: false`, e a leitura aceita todos. Ver api#263.
 */
export interface TournamentFormatInfo {
    id: TournamentFormat;
    label: string;
    description: string;
    implemented: boolean;
}

export type CompetitionLevel =
    | "BEGINNER"
    | "INTERMEDIATE"
    | "AMATEUR"
    | "ADVANCED"
    | "PROFESSIONAL";

export type OrganizerType = "PLACE" | "USER" | "COMPANY" | "OTHER";
export type ParticipantType = "TEAM" | "INDIVIDUAL";
export type RegistrationMode = "OPEN" | "APPROVAL_REQUIRED";
export type EquipmentCondition = "BOM" | "DESGASTADO" | "MANUTENCAO" | "INATIVO";
export type EquipmentSettlementType = "DEVOLUCAO" | "PERDA" | "QUEBRA";

// ─── Envelope ────────────────────────────────────────────────────────────────

/**
 * Toda resposta de sucesso da API vem embrulhada assim. Os serviços devolvem o
 * envelope inteiro (não o `data` interno), então quem consome escreve
 * `res.data.algumaCoisa` — comportamento preservado da versão em JS.
 */
export interface ApiEnvelope<T> {
    success: true;
    data: T;
}

export interface ApiErrorBody {
    success: false;
    message: string;
    code?: string;
    detail?: string;
}

// ─── Entidades ───────────────────────────────────────────────────────────────

/** Datas chegam como string: são serializadas em JSON. */
export type IsoDate = string;

export interface UserPublic {
    id: string;
    name: string;
    nickname?: string | null;
    avatarUrl: string | null;
    badge: UserBadge | null;
    role: UserRole;
    createdAt: IsoDate;
}

export interface UserMe extends UserPublic {
    email: string;
    /**
     * Privado, e só existe nas duas visões de "eu" — `/auth/me` e `/users/me`.
     * `UserPublic` não tem telefone de propósito: qualquer pessoa abre o perfil
     * de qualquer outra. Ver api#319.
     */
    phone: string | null;
    pixKey: string | null;
    marketingOptIn: boolean;
    stats?: UserStats;
    _count?: {
        peladasCreated: number;
        participations: number;
        reviewsReceived: number;
    };
}

export interface UserStats {
    averageStars: number | null;
    totalReviews: number;
    totalPeladas: number;
    tags: Array<{ tag: ReviewTag; count: number }>;
}

/**
 * O usuário que sai de /auth/login, /auth/google, /auth/register e
 * /auth/register-owner: os campos públicos da conta mais o e-mail, e nada além
 * disso.
 *
 * Não é um `UserMe` — falta o `pixKey`, que só sai no GET /auth/me. Os dois
 * tipos ficam separados de propósito: enquanto o payload de autenticação era
 * tipado como `UserMe`, dava para jogá-lo direto no estado do AuthContext e o
 * compilador não via problema nenhum — o formulário de perfil é que descobria,
 * em produção, que o `pixKey` nunca tinha chegado.
 */
export interface UserSessao extends UserPublic {
    email: string;
}

export interface AuthResult {
    user: UserSessao;
    token: string;
}

export interface PlaceSummary {
    id: string;
    name: string;
    city: string;
    neighborhood?: string;
    state: string;
}

export interface Place extends PlaceSummary {
    street: string;
    number: string;
    complement: string | null;
    zipCode: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    status: PlaceStatus;
    ownerId: string | null;
    owner?: { id: string; name: string } | null;
    courts?: Court[];
    _count?: { courts: number };
    createdAt: IsoDate;
    updatedAt: IsoDate;
}

export interface Court {
    id: string;
    name: string;
    type: CourtType;
    status: CourtStatus;
    pricePerHour: string | number | null;
    placeId: string;
    place?: PlaceSummary & { owner?: { id: string; name: string } | null };
    createdAt: IsoDate;
    updatedAt: IsoDate;
}

export interface PeladaParticipant {
    userId: string;
    user: Pick<UserPublic, "id" | "name" | "nickname" | "avatarUrl">;
}

/** Um requisito de entrada configurado na pelada. */
export interface PeladaRequirement {
    type: PeladaRequirementType;
    /** O formato depende do tipo. Os três de reputação usam `{ min: number }`. */
    params: { min?: number } | null;
}

export type PeladaRequirementType =
    | "MIN_ATTENDANCE_RATE"
    | "MIN_AVERAGE_RATING"
    | "MIN_MATCHES_PLAYED"
    | "BADGE";

/** Um motivo de recusa do portão de entrada. */
export interface EntryFailure {
    /** Código estável. É por ele que a tela decide o que mostrar, não pela frase. */
    code: string;
    message: string;
    /** Só nas recusas de reputação: os mesmos valores da frase, em número. */
    numeros?: { exigido: number; atual: number };
}

/** Como um requisito saiu da avaliação deste jogador. */
export interface EntryRequirementResult {
    type: PeladaRequirementType;
    params: { min?: number } | null;
    met: boolean;
    failure?: EntryFailure;
}

/**
 * A resposta de `GET .../participations/entry`.
 *
 * **Sempre 200, mesmo quando a resposta é não** — perguntar não é ser recusado.
 * `requirements` vem vazio para o organizador, que não se submete aos próprios
 * requisitos.
 */
export interface EntryVerdict {
    allowed: boolean;
    failures: EntryFailure[];
    requirements: EntryRequirementResult[];
}

export interface Pelada {
    id: string;
    date: IsoDate;
    status: PeladaStatus;
    maxPlayers: number;
    totalValue: string | number;
    pixKey: string;
    courtId: string;
    organizerId: string;
    court?: Pick<Court, "id" | "name" | "type"> & { place: PlaceSummary };
    organizer?: Pick<UserPublic, "id" | "name" | "avatarUrl">;
    participations?: PeladaParticipant[];
    /**
     * As regras de entrada da pelada, na leitura pública (api#332).
     *
     * Vem sempre — lista vazia quando não há requisito —, e é o que permite a
     * tela mostrar a barra a quem **não está logado**: a consulta de entrada
     * exige sessão, porque a resposta dela é sobre um jogador específico.
     */
    requirements?: PeladaRequirement[];
    _count?: { participations: number };
    createdAt: IsoDate;
    updatedAt: IsoDate;
}

export interface Equipment {
    id: string;
    placeId: string;
    nome: string;
    modalidade: CourtType | null;
    quantidadeTotal: number;
    quantidadeFora: number;
    quantidadeDisponivel: number;
    estado: EquipmentCondition;
    createdAt: IsoDate;
    updatedAt: IsoDate;
}

export interface EquipmentBorrower {
    id: string;
    name: string;
    nickname: string | null;
    avatarUrl: string | null;
}

export interface EquipmentPelada {
    id: string;
    date: IsoDate;
    status: PeladaStatus;
    court: { id: string; name: string };
    organizer: EquipmentBorrower;
}

export interface EquipmentSettlement {
    id: string;
    tipo: EquipmentSettlementType;
    quantidade: number;
    observacao: string | null;
    createdAt: IsoDate;
    actor: EquipmentBorrower;
}

export interface EquipmentLoan {
    id: string;
    equipmentId: string;
    borrowerId: string;
    peladaId: string | null;
    quantidadeEmprestada: number;
    quantidadeDevolvida: number;
    quantidadeBaixada: number;
    quantidadePendente: number;
    emprestadoEm: IsoDate;
    encerradoEm: IsoDate | null;
    observacao: string | null;
    equipment: Equipment;
    borrower: EquipmentBorrower;
    createdBy: EquipmentBorrower;
    pelada: { id: string; date: IsoDate; court?: { id: string; name: string } } | null;
    settlements: EquipmentSettlement[];
}

/** Resposta paginada de GET /events. */
export interface PeladaSearchResult {
    events: Pelada[];
    total: number;
    page: number;
    hasMore: boolean;
}

export interface Participation {
    peladaId: string;
    userId: string;
    attended: boolean | null;
    joinedAt: IsoDate;
    user?: UserPublic & { email?: string };
    pelada?: Pelada;
}

export interface Review {
    id: string;
    stars: number;
    tag: ReviewTag;
    comment: string | null;
    peladaId: string;
    reviewerId: string;
    reviewedId: string;
    reviewer?: Pick<UserPublic, "id" | "name" | "avatarUrl">;
    reviewed?: Pick<UserPublic, "id" | "name" | "avatarUrl" | "badge">;
    pelada?: Pick<Pelada, "id" | "date"> & {
        court: { id: string; name: string; place: { id: string; name: string } };
    };
    createdAt: IsoDate;
}

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data: { peladaId?: string } | null;
    read: boolean;
    createdAt: IsoDate;
}

export interface NotificationList {
    notifications: Notification[];
    unreadCount: number;
}

export interface TournamentDivision {
    id: string;
    tournamentId: string;
    name: string;
    description: string | null;
    genderRestriction: string | null;
    ageRestriction: string | null;
    level: CompetitionLevel;
    minPlayersPerTeam: number;
    maxPlayersPerTeam: number;
    maxParticipants: number | null;
    /**
     * Se a chave desta divisão tem disputa de terceiro lugar (api#304).
     *
     * A tela não decide nada por ele: quem diz que a partida existe é o
     * `loserNextMatchId` das semifinais, e a api ignora o pedido quando as duas
     * semis não são partida de verdade. Ligado aqui e ausente na chave são
     * estados possíveis ao mesmo tempo, e é a chave que manda.
     */
    thirdPlaceMatch: boolean;
    /**
     * Quantas inscrições **aprovadas** a divisão já tem.
     *
     * Só as aprovadas: pendente é candidato e não ocupa vaga, recusado não está
     * no campeonato. É o número que permite dizer "lotada" antes do clique, em
     * vez de descobrir no 422 — ver a api#314.
     *
     * Opcional porque respostas gravadas antes daquela entrega não o têm.
     */
    _count?: { approvedRegistrations: number };
    createdAt: IsoDate;
    updatedAt: IsoDate;
}

/**
 * A inscrição de um jogador numa divisão.
 *
 * `adminNote` é a justificativa que o organizador escreve ao recusar, e é o que
 * o jogador lê para saber se adianta tentar de novo. `respondedAt` fica nulo
 * enquanto a inscrição está `PENDING`.
 */
export interface TournamentRegistration {
    id: string;
    divisionId: string;
    userId: string;
    status: TournamentRegistrationStatus;
    adminNote: string | null;
    respondedAt: IsoDate | null;
    createdAt: IsoDate;
    /** Vem preenchida em `GET /tournaments/:id/registrations/me`. */
    division?: Pick<TournamentDivision, "id" | "name" | "level" | "tournamentId">;
    /**
     * Vem preenchido na lista do organizador
     * (`GET /tournaments/:id/divisions/:id/registrations`), e só nela — a rota
     * é protegida por `isTournamentManager`. O `email` está aí porque é como o
     * organizador reconhece quem ele não conhece pelo nome.
     */
    user?: Pick<UserPublic, "id" | "name" | "avatarUrl" | "badge"> & { email: string };
}

/**
 * Estados de uma inscrição. `PENDING` só existe em campeonato cujo modo de
 * inscrição exige aprovação — nos outros ela já nasce `APPROVED`.
 */
export type TournamentRegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Estados de uma partida do chaveamento, na ordem em que acontecem. */
export type TournamentMatchStatus = "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "FINISHED" | "WALKOVER";

/**
 * Um lado da partida.
 *
 * O `id` é o da **inscrição**, e não o do usuário: a partida referencia
 * `TournamentRegistration`, porque quem joga o campeonato é quem se inscreveu
 * nele. O `user` vem junto porque a tela mostra nome, e não id de inscrição.
 */
export interface TournamentMatchSide {
    id: string;
    status: TournamentRegistrationStatus;
    user: Pick<UserPublic, "id" | "name" | "avatarUrl" | "badge">;
}

/**
 * Uma partida do chaveamento.
 *
 * `round` começa em 1 e cresce até a final; `orderInRound` dá a posição dentro
 * da rodada. É esse par que mantém o desenho da chave estável entre requests — a
 * API já devolve a lista ordenada por ele, e quem consome não precisa reordenar.
 *
 * Quase tudo é anulável de propósito: a partida existe na chave antes de saber
 * quem joga, onde e quando. E `winnerId` preenchido com placar vazio não é
 * inconsistência — é o `WALKOVER`, vitória sem jogo, que é justamente o motivo
 * de o vencedor ser gravado em vez de derivado do placar.
 */
export interface TournamentMatch {
    id: string;
    divisionId: string;
    round: number;
    orderInRound: number;
    participantAId: string | null;
    participantBId: string | null;
    /** Para onde o vencedor avança. `null` na final. */
    nextMatchId: string | null;
    /**
     * Para onde o **perdedor** vai: a disputa de terceiro lugar (api#304).
     * Preenchido só nas semifinais, e só quando a divisão pediu a partida.
     *
     * É por ele que a tela identifica a disputa — a partida apontada por algum
     * `loserNextMatchId` é ela. Ler pela posição na rodada seria mais curto e
     * dependeria de uma convenção que o dado não expressa.
     */
    loserNextMatchId: string | null;
    courtId: string | null;
    scheduledAt: IsoDate | null;
    status: TournamentMatchStatus;
    scoreA: number | null;
    scoreB: number | null;
    winnerId: string | null;
    refereeId: string | null;
    participantA: TournamentMatchSide | null;
    participantB: TournamentMatchSide | null;
    winner: TournamentMatchSide | null;
    court: Pick<Court, "id" | "name" | "type"> | null;
    referee: Pick<UserPublic, "id" | "name" | "avatarUrl" | "badge"> | null;
    createdAt: IsoDate;
    updatedAt: IsoDate;
}

/**
 * A partida como ela volta em `GET /tournaments/matches/refereeing`.
 *
 * A rota inclui divisão e campeonato porque a lista do árbitro atravessa
 * campeonatos: sem o nome de cada um, ele saberia o placar a lançar e não
 * saberia de qual torneio.
 */
export interface RefereeingMatch extends TournamentMatch {
    division: Pick<TournamentDivision, "id" | "name"> & {
        tournament: Pick<Tournament, "id" | "name" | "status">;
    };
}

export interface Tournament {
    id: string;
    name: string;
    description: string | null;
    placeId: string;
    organizerType: OrganizerType;
    organizerName: string | null;
    organizerUserId: string | null;
    sportType: CourtType;
    format: TournamentFormat;
    participantType: ParticipantType;
    registrationMode: RegistrationMode;
    registrationStartDate: IsoDate | null;
    registrationEndDate: IsoDate | null;
    startDate: IsoDate | null;
    endDate: IsoDate | null;
    maxParticipants: number | null;
    registrationFee: string | number | null;
    paymentInstructions: string | null;
    pixKey: string | null;
    rules: string | null;
    status: TournamentStatus;
    place?: PlaceSummary;
    createdBy?: { id: string; name: string };
    organizerUser?: { id: string; name: string } | null;
    divisions?: TournamentDivision[];
    _count?: { divisions: number };
    createdAt: IsoDate;
    updatedAt: IsoDate;
}

export interface PlaceRequest {
    id: string;
    name: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    status: PlaceRequestStatus;
    adminNote: string | null;
    owner: { id: string; name: string; email: string };
    createdAt: IsoDate;
    updatedAt: IsoDate;
}

export interface Sport {
    id: CourtType;
    label: string;
    icon: string;
    description: string;
    group: string;
    groupLabel: string;
    groupIcon: string;
    groupOrder: number;
}

/**
 * Como o jogador joga numa modalidade. Um registro por (jogador, modalidade) —
 * a mesma pessoa pode ser avançada no futsal e iniciante no vôlei.
 *
 * `position` é texto livre e nulo quer dizer "jogo em qualquer posição", que é a
 * resposta honesta da maioria.
 */
export interface SportProfile {
    sport: CourtType;
    level: CompetitionLevel;
    position: string | null;
    updatedAt: string;
}

/** Os dois jeitos de dividir os times. `ALEATORIO` é o padrão da API. */
export type DrawMode = "ALEATORIO" | "EQUILIBRADO";

/**
 * Índice de nível de um jogador na modalidade da partida.
 *
 * `estimado: true` quer dizer que ele não declarou nível nem foi avaliado nela,
 * e o número é um palpite neutro. A tela precisa dizer isso — 50 apresentado
 * como medida dá confiança falsa no equilíbrio.
 */
export interface SkillIndex {
    valor: number;
    estimado: boolean;
}

/**
 * Os campos abaixo são **opcionais de propósito**, e não porque a API às vezes
 * os omite: ela sempre os devolve, desde a api#206.
 *
 * O que eles representam é a **janela de release**. Front e API sobem separados,
 * e por algumas horas o app novo conversa com a API anterior — que não conhece
 * `skill`, `averageSkill` nem `balance`. Declarar como obrigatório o que só
 * existe depois do outro release faz o TypeScript prometer o que a rede não
 * garante, e o preço é uma tela branca no meio da janela.
 */
export interface DrawPlayer extends Pick<UserPublic, "id" | "name" | "avatarUrl" | "badge"> {
    position?: string | null;
    skill?: SkillIndex;
}

export interface DrawTeam {
    name: string;
    players: DrawPlayer[];
    /** Soma dos índices do time. Ausente quando a API ainda é anterior à api#206. */
    skillIndex?: number;
    /** Índice médio por jogador — é por ele que o equilíbrio se mede. */
    averageSkill?: number;
}

export interface DrawResult {
    peladaId: string;
    teamCount: number;
    totalPlayers: number;
    mode?: DrawMode;
    teams: DrawTeam[];
    /** Ausente quando a API ainda é anterior à api#206 — ver a nota em DrawPlayer. */
    balance?: {
        /** Diferença de índice médio entre o time mais forte e o mais fraco. */
        spread: number;
        /** O alvo perseguido pelo modo equilibrado. */
        target: number;
        /** `false` quando os jogadores presentes não permitiam chegar ao alvo. */
        withinTarget: boolean;
        /** Quantos jogadores entraram com índice estimado. */
        estimatedPlayers: number;
    };
}

/**
 * O que um degrau da grade abre no painel do parceiro.
 *
 * Espelha o enum `PlanFeature` da API. Fora daqui ficaram, de propósito,
 * Solicitações, Meus Estabelecimentos e a própria tela de Planos: são como o dono
 * entra na plataforma, o que ele já contratou e como ele paga — trancar qualquer um
 * deixaria o cliente do lado de fora da própria assinatura.
 */
export type PlanFeature = "ESTATISTICAS" | "EQUIPAMENTOS" | "ESTOQUE";

export interface Plan {
    id: string;
    nome: string;
    precoCentavos: number;
    /**
     * O que o plano abre. **Lista vazia é o degrau de entrada, não plano quebrado** —
     * cadastrar a arena e receber partidas não depende de funcionalidade nenhuma.
     * Nenhum plano limita quantidade de quadras, espaços ou modalidades (api#278).
     */
    funcionalidades: PlanFeature[];
}

export interface SubscriptionUsage {
    quadras: number;
    estabelecimentos: number;
}

/**
 * Downgrade contratado que ainda não valeu.
 *
 * Downgrade passa a valer no fim do ciclo: o dono usa até o fim o que já
 * pagou. Até lá, `SubscriptionStatus.plan` continua sendo o plano em vigor —
 * é ele que rege o acesso — e isto aqui diz para onde vai.
 */
export interface TrocaAgendada {
    plan: Plan;
    valeAPartirDe: IsoDate;
}

export interface SubscriptionStatus {
    status: string;
    currentPeriodEnd: IsoDate | null;
    stripeSubscriptionId?: string | null;
    /** O plano EM VIGOR, mesmo havendo troca agendada. */
    plan?: Plan | null;
    trocaAgendada?: TrocaAgendada | null;
    usage?: SubscriptionUsage;
}

export type SwitchPlanEffectType = "upgrade" | "downgrade" | "mesmo_preco";

export interface SwitchPlanPreview {
    planoAtual: Pick<Plan, "id" | "nome" | "precoCentavos"> | null;
    planoNovo: Pick<Plan, "id" | "nome" | "precoCentavos">;
    tipo: SwitchPlanEffectType;
    /**
     * Aproximada — o valor exato vai para a fatura seguinte na Stripe.
     *
     * **Zero no downgrade**, e não é arredondamento: como a troca só vale no
     * fim do ciclo, nada é cobrado nem creditado agora.
     */
    estimativaCobrancaCentavos: number;
    /** `true` no upgrade, que vale na hora; `false` no downgrade. */
    efetivaImediatamente: boolean;
    /** Quando o downgrade passa a valer. Null quando a troca é imediata. */
    valeAPartirDe: IsoDate | null;
    /**
     * O que o dono deixa de acessar ao descer de degrau, para a tela avisar antes do
     * clique. Vazio no upgrade. Nada é apagado: os dados ficam esperando um upgrade.
     */
    funcionalidadesPerdidas: PlanFeature[];
}

export type InventoryUnit = 'UNIDADE' | 'GARRAFA' | 'LATA' | 'PACOTE' | 'CAIXA' | 'QUILOGRAMA';
export type InventoryMovementType = 'ENTRADA' | 'SAIDA';
export type InventoryMovementReason = 'COMPRA' | 'REPOSICAO' | 'VENDA' | 'PERDA' | 'AJUSTE';

export interface InventoryProduct {
    id: string;
    placeId: string;
    nome: string;
    unidade: InventoryUnit;
    precoVendaCentavos: number;
    estoqueMinimo: number;
    ativo: boolean;
    saldoAtual: number;
    estoqueBaixo: boolean;
    createdAt: IsoDate;
    updatedAt: IsoDate;
}

export interface InventoryMovement {
    id: string;
    productId: string;
    tipo: InventoryMovementType;
    motivo: InventoryMovementReason;
    quantidade: number;
    observacao: string | null;
    createdAt: IsoDate;
    saldoAtual?: number;
    estoqueBaixo?: boolean;
    actor: Pick<UserPublic, 'id' | 'name' | 'role'>;
    product: Pick<InventoryProduct, 'id' | 'nome' | 'unidade'>;
}

export interface OwnerStats {
    totalPlaces: number;
    totalCourts: number;
    activeEvents: number;
    pendingRequests: number;
}

export interface AdminStats {
    totalArenas: number;
    active: number;
    revenue: string;
    expiring: number;
}
