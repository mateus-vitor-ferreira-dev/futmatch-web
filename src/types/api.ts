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

export type CompetitionLevel =
    | "BEGINNER"
    | "INTERMEDIATE"
    | "AMATEUR"
    | "ADVANCED"
    | "PROFESSIONAL";

export type OrganizerType = "PLACE" | "USER" | "COMPANY" | "OTHER";
export type ParticipantType = "TEAM" | "INDIVIDUAL";
export type RegistrationMode = "OPEN" | "APPROVAL_REQUIRED";

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
    pixKey: string | null;
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
    _count?: { participations: number };
    createdAt: IsoDate;
    updatedAt: IsoDate;
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
    createdAt: IsoDate;
    updatedAt: IsoDate;
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

export interface DrawTeam {
    name: string;
    players: Array<Pick<UserPublic, "id" | "name" | "avatarUrl" | "badge">>;
}

export interface DrawResult {
    peladaId: string;
    teamCount: number;
    totalPlayers: number;
    teams: DrawTeam[];
}

export interface SubscriptionStatus {
    status: string;
    currentPeriodEnd: IsoDate | null;
    stripeSubscriptionId?: string | null;
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
