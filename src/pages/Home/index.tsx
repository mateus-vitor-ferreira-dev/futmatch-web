import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, Users, ChevronRight, Search, Zap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { MainLayout } from '../../components'
import { playerService } from '../../services/playerService'
import { useSports, getSportMeta } from '../../hooks/useSports'
import type { CourtType } from '../../types/api'
import type { SportOption } from '../../hooks/useSports'
import {
  PageWrapper,
  HeroBanner, HeroDecor1, HeroDecor2, HeroGreeting, HeroTitle, HeroSubtitle,
  StatsRow, StatBox, StatIconBox, StatInfo, StatValue, StatLabel,
  TabsRow, Tab,
  SectionBlock, SectionHeader, SectionTitle, SectionSubtitle, SeeAllBtn,
  GamesGrid, GameCardWrapper, CardTop, CardCourtIcon, CardCourtInfo,
  CourtName, SportBadge, VagasBadge, CardMeta, MetaRow,
  CardBottom, PlayerCount, Price, ProgressBar, ProgressFill, EmptyState,
  CTARow, CTAPrimary, CTASecondary,
  ModalityGrid, ModalityCard, ModalityIconBox, ModalityInfo, ModalityName, ModalityCount,
  TipCard, TipIcon, TipContent, TipTitle, TipText,
} from './styles'

interface FiltroTab {
  id: string
  label: string
  icon: string
  /** null = sem restrição de modalidade. */
  types: CourtType[] | null
}

const ALL_TAB: FiltroTab = { id: 'ALL', label: 'Todos', icon: '🎯', types: null }

const TIPS = [
  { title: 'Dica de craque', text: 'Avalie seus colegas após cada jogo e ajude a construir uma comunidade confiável — seja no campo, na areia ou na mesa!' },
  { title: 'Pontualidade é respeito', text: 'Chegue 10 minutos antes do início para aquecer e conhecer os outros jogadores.' },
  { title: 'Comunique ausências', text: 'Se não puder comparecer, avise com antecedência para não deixar o time na mão.' },
  { title: 'Hidratação é essencial', text: 'Beba água antes, durante e após o jogo para manter o desempenho em alta.' },
  { title: 'Respeite o organizador', text: 'Siga as regras combinadas pelo dono do jogo — todos agradecem!' },
]

function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

function getDailyTip() {
  return TIPS[Math.floor(Date.now() / 86400000) % TIPS.length]
}

/**
 * Estes helpers testam vários nomes de campo alternativos (scheduledAt,
 * startTime, startsAt, court.address, price...). A maioria não existe no
 * contrato atual da API — são resquícios de formatos anteriores. Tipados de
 * forma permissiva para preservar exatamente o comportamento defensivo.
 */
type EventoSolto = Record<string, unknown> & {
  participations?: unknown
  _count?: { participations?: number }
  court?: Record<string, unknown> & { place?: Record<string, unknown> }
}

function normalizeList(result: unknown): EventoSolto[] {
  if (Array.isArray(result)) return result as EventoSolto[]
  const r = result as { data?: { events?: unknown } | unknown; events?: unknown; items?: unknown } | null
  const data = (r as { data?: { events?: unknown } })?.data
  if (data && Array.isArray((data as { events?: unknown }).events)) return (data as { events: EventoSolto[] }).events
  if (Array.isArray(data)) return data as EventoSolto[]
  if (Array.isArray(r?.events)) return r!.events as EventoSolto[]
  if (Array.isArray(r?.items)) return r!.items as EventoSolto[]
  return []
}

function getParticipationCount(event: EventoSolto): number {
  if (typeof event.participations === 'number') return event.participations
  if (Array.isArray(event.participations)) return event.participations.length
  if (typeof event._count?.participations === 'number') return event._count.participations
  return 0
}

function getEventDateStr(event: EventoSolto): string {
  const raw = (event.scheduledAt || event.startTime || event.date || event.startsAt) as string | undefined
  if (!raw) return ''
  const d = new Date(raw)
  const datePart = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace(/\.$/, '')
  const timePart = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${datePart} · ${timePart}`
}

function getCourtName(event: EventoSolto): string {
  return (event.courtName || event.court?.name || event.name || 'Quadra') as string
}

function getAddress(event: EventoSolto): string {
  return (event.address || event.court?.address || event.court?.place?.address || event.place || event.city || '') as string
}

function getPricePerPlayer(event: EventoSolto): string {
  const total = parseFloat(String(event.totalValue ?? event.price ?? 0))
  const players = Number(event.maxPlayers) || 1
  return (total / players).toFixed(0)
}

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { sports: allSports } = useSports()
  const SPORT_TABS = [ALL_TAB, ...allSports]

  const [events, setEvents] = useState<EventoSolto[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [stats, setStats] = useState({ total: 0, thisMonth: 0 })
  const [activeSport, setActiveSport] = useState('ALL')

  const fetchFeaturedEvents = useCallback(async () => {
    try {
      setLoadingEvents(true)
      /*
       * ⚠️ Dois filtros aqui eram no-op e foram removidos:
       *
       * 1. `date: today` — o searchEventsQuerySchema da API aceita `from` e
       *    `to`, não `date`. Com stripUnknown o campo era descartado, então
       *    este bloco NUNCA restringiu a busca ao dia de hoje. O efeito real
       *    sempre foi "peladas futuras", que é o default do backend quando
       *    nenhuma faixa é informada.
       *
       * 2. `city: user.city` — o model User não tem coluna `city`, então
       *    user.city era sempre undefined e o spread condicional jamais
       *    adicionava o filtro.
       *
       * Comportamento preservado de propósito: restringir a hoje mudaria o que
       * a home exibe. Para filtrar por hoje de fato, usar { from, to }.
       */
      const result = await playerService.searchEvents({
        status: 'WAITING',
      })
      setEvents(normalizeList(result))
    } catch {
      setEvents([])
    } finally {
      setLoadingEvents(false)
    }
    // `user` saiu das dependências junto com o filtro `city: user.city`
    // descrito acima: o callback não lê mais nada de `user`, e mantê-lo aqui
    // só recriava a função — e refazia a busca — a cada nova identidade do
    // objeto. A Home fica atrás de PrivateRoute, então o usuário já está
    // carregado na montagem. Mesmo critério do fetchStats logo abaixo.
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const result = await playerService.getMyParticipatingEvents({})
      const arr = normalizeList(result)
      const now = new Date()
      const thisMonth = arr.filter(e => {
        const raw = (e.scheduledAt || e.startTime || e.date || e.startsAt || e.createdAt) as string | undefined
        if (!raw) return false
        const d = new Date(raw)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      setStats({ total: arr.length, thisMonth: thisMonth.length })
    } catch {
      // mantém os valores padrão
    }
  }, [])

  useEffect(() => {
    fetchFeaturedEvents()
    fetchStats()
  }, [fetchFeaturedEvents, fetchStats])

  const filteredEvents = activeSport === 'ALL'
    ? events
    : events.filter(e => e.court?.type === activeSport)

  const sportCountMap = allSports.reduce<Record<string, number>>((acc, sport) => {
    acc[sport.id] = events.filter(e => e.court?.type === sport.id).length
    return acc
  }, {})

  const firstName = user?.name?.split(' ')[0] || 'Jogador'
  const tip = getDailyTip()

  return (
    <MainLayout user={user}>
      <PageWrapper>

        {/* Hero Banner */}
        <HeroBanner>
          <HeroDecor1 />
          <HeroDecor2 />
          <HeroGreeting>👋 {getGreeting()}, {firstName}!</HeroGreeting>
          <HeroTitle>E aí, bora jogar hoje? 🎯</HeroTitle>
          <HeroSubtitle>
            {events.length > 0
              ? `${events.length} jogo${events.length !== 1 ? 's' : ''} aberto${events.length !== 1 ? 's' : ''} perto de você — futebol, vôlei, beach tennis e mais.`
              : 'Explore os jogos disponíveis e entre numa pelada hoje!'}
          </HeroSubtitle>
        </HeroBanner>

        {/* Stats Cards */}
        <StatsRow>
          <StatBox>
            <StatIconBox>🏆</StatIconBox>
            <StatInfo>
              <StatValue>{stats.total}</StatValue>
              <StatLabel>Jogos</StatLabel>
            </StatInfo>
          </StatBox>
          <StatBox>
            <StatIconBox>⭐</StatIconBox>
            <StatInfo>
              {/*
                * Era user.rating — campo inexistente na API, então o ternário
                * sempre caía no '—'. O valor real é stats.averageStars, que
                * /auth/me não devolve (ver nota em MainLayout).
                */}
              <StatValue>{user?.stats?.averageStars != null ? Number(user.stats.averageStars).toFixed(1) : '—'}</StatValue>
              <StatLabel>Nota</StatLabel>
            </StatInfo>
          </StatBox>
          <StatBox>
            <StatIconBox>📅</StatIconBox>
            <StatInfo>
              <StatValue>{stats.thisMonth}</StatValue>
              <StatLabel>Este mês</StatLabel>
            </StatInfo>
          </StatBox>
        </StatsRow>

        {/* Sport Tabs */}
        <TabsRow>
          {SPORT_TABS.map(tab => (
            <Tab
              key={tab.id}
              $active={activeSport === tab.id}
              onClick={() => setActiveSport(tab.id)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </Tab>
          ))}
        </TabsRow>

        {/* Jogos em Destaque */}
        <SectionBlock>
          <SectionHeader>
            <div>
              <SectionTitle>Jogos em destaque</SectionTitle>
              <SectionSubtitle>
                {filteredEvents.length} disponíve{filteredEvents.length !== 1 ? 'is' : 'l'} agora
              </SectionSubtitle>
            </div>
            <SeeAllBtn onClick={() => navigate('/quero-jogar')}>
              Ver todos <ChevronRight size={16} />
            </SeeAllBtn>
          </SectionHeader>

          {loadingEvents ? (
            <EmptyState>Carregando jogos...</EmptyState>
          ) : filteredEvents.length === 0 ? (
            <EmptyState>Nenhum jogo disponível no momento.</EmptyState>
          ) : (
            <GamesGrid>
              {filteredEvents.slice(0, 4).map((event: EventoSolto) => {
                const participations = getParticipationCount(event)
                const maxPlayers = Number(event.maxPlayers) || 0
                const vagas = maxPlayers - participations
                const pct = maxPlayers > 0 ? Math.round((participations / maxPlayers) * 100) : 0
                const courtName = getCourtName(event)
                const sport = getSportMeta(event.court?.type as CourtType)
                const sportLabel = sport.label
                const address = getAddress(event)
                const dateStr = getEventDateStr(event)
                const pricePerPlayer = getPricePerPlayer(event)

                return (
                  <GameCardWrapper key={String(event.id)} onClick={() => navigate(`/pelada/${String(event.id)}`)}>
                    <CardTop>
                      <CardCourtIcon>{sport.icon}</CardCourtIcon>
                      <CardCourtInfo>
                        <CourtName>{courtName}</CourtName>
                        <SportBadge>{sportLabel}</SportBadge>
                      </CardCourtInfo>
                      {vagas > 0 && <VagasBadge>{vagas} vagas</VagasBadge>}
                    </CardTop>

                    <CardMeta>
                      {address && (
                        <MetaRow>
                          <MapPin size={14} />
                          {address}
                        </MetaRow>
                      )}
                      {dateStr && (
                        <MetaRow>
                          <Clock size={14} />
                          {dateStr}
                        </MetaRow>
                      )}
                    </CardMeta>

                    <CardBottom>
                      <PlayerCount>
                        <Users size={14} />
                        {participations}/{maxPlayers}
                      </PlayerCount>
                      {Number(pricePerPlayer) > 0 && <Price>R$ {pricePerPlayer}</Price>}
                    </CardBottom>

                    <ProgressBar>
                      <ProgressFill $pct={pct} />
                    </ProgressBar>
                  </GameCardWrapper>
                )
              })}
            </GamesGrid>
          )}
        </SectionBlock>

        {/* CTAs */}
        <CTARow>
          <CTAPrimary onClick={() => navigate('/quero-jogar')}>
            <Search size={18} />
            Entrar em um jogo
          </CTAPrimary>
          <CTASecondary onClick={() => navigate('/minhas-peladas?action=criar')}>
            <Zap size={18} />
            Criar jogo
          </CTASecondary>
        </CTARow>

        {/* Explorar por Modalidade */}
        <SectionBlock>
          <SectionHeader>
            <SectionTitle>Explorar por modalidade</SectionTitle>
          </SectionHeader>
          <ModalityGrid>
            {allSports.map((sport: SportOption) => {
              const count = sportCountMap[sport.id] ?? 0
              return (
                <ModalityCard
                  key={sport.id}
                  onClick={() => navigate(`/quero-jogar?sport=${sport.id}`)}
                >
                  <ModalityIconBox>{sport.icon}</ModalityIconBox>
                  <ModalityInfo>
                    <ModalityName>{sport.label}</ModalityName>
                    <ModalityCount>{count} aberto{count !== 1 ? 's' : ''}</ModalityCount>
                  </ModalityInfo>
                </ModalityCard>
              )
            })}
          </ModalityGrid>
        </SectionBlock>

        {/* Dica de Craque */}
        <TipCard>
          <TipIcon>💡</TipIcon>
          <TipContent>
            <TipTitle>{tip.title}</TipTitle>
            <TipText>{tip.text}</TipText>
          </TipContent>
        </TipCard>

      </PageWrapper>
    </MainLayout>
  )
}
