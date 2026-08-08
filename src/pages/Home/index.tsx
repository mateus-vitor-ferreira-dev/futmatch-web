import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, Users, Search, Zap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { MainLayout } from '../../components'
import { playerService } from '../../services/playerService'
import { useSports, getSportMeta } from '../../hooks/useSports'
import type { CourtType } from '../../types/api'
import {
  PageWrapper,
  CompactHeader, GreetingBlock, GreetingText, GreetingTitle,
  StatsRow, StatBox, StatIconBox, StatInfo, StatValue, StatLabel,
  TabsWrapper, TabsRow, TabsFade, Tab,
  SectionBlock, SectionHeader, SectionTitle, SectionSubtitle,
  GamesGrid, GameCardWrapper, CardTop, CardCourtIcon, CardCourtInfo,
  CourtName, SportBadge, VagasBadge, CardMeta, MetaRow,
  CardBottom, PlayerCount, Price, ProgressBar, ProgressFill, EmptyState,
  CTARow, CTAPrimary, CTASecondary,
} from './styles'

interface FiltroTab {
  id: string
  label: string
  icon: string
  /** null = sem restrição de modalidade. */
  types: CourtType[] | null
}

const ALL_TAB: FiltroTab = { id: 'ALL', label: 'Todos', icon: '🎯', types: null }

function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
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
  const [totalGames, setTotalGames] = useState(0)
  const [activeSport, setActiveSport] = useState('ALL')
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)

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
      setTotalGames(normalizeList(result).length)
    } catch {
      // mantém o valor padrão
    }
  }, [])

  useEffect(() => {
    fetchFeaturedEvents()
    fetchStats()
  }, [fetchFeaturedEvents, fetchStats])

  const filteredEvents = activeSport === 'ALL'
    ? events
    : events.filter(e => e.court?.type === activeSport)

  const updateFades = useCallback(() => {
    const el = tabsRef.current
    if (!el) return
    setShowLeftFade(el.scrollLeft > 4)
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateFades()
    window.addEventListener('resize', updateFades)
    return () => window.removeEventListener('resize', updateFades)
  }, [updateFades, allSports])

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
  }, [activeSport])

  const firstName = user?.name?.split(' ')[0] || 'Jogador'

  return (
    <MainLayout user={user}>
      <PageWrapper>

        {/* Saudação compacta */}
        <CompactHeader>
          <GreetingBlock>
            <GreetingText>👋 {getGreeting()}, {firstName}!</GreetingText>
            <GreetingTitle>E aí, bora jogar hoje?</GreetingTitle>
          </GreetingBlock>
        </CompactHeader>

        {/* Ações — encontrar ou criar um jogo, lado a lado, sem precisar rolar a tela */}
        <CTARow>
          <CTAPrimary onClick={() => navigate('/quero-jogar')}>
            <Search size={18} />
            Encontrar um jogo
          </CTAPrimary>
          <CTASecondary onClick={() => navigate('/minhas-peladas?action=criar')}>
            <Zap size={18} />
            Criar jogo
          </CTASecondary>
        </CTARow>

        {/* Métricas do jogador */}
        <StatsRow>
          <StatBox>
            <StatIconBox>🏆</StatIconBox>
            <StatInfo>
              <StatValue>{totalGames}</StatValue>
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
        </StatsRow>

        {/* Seletor único de modalidades */}
        <TabsWrapper>
          <TabsRow ref={tabsRef} onScroll={updateFades} role="group" aria-label="Filtrar por modalidade">
            {SPORT_TABS.map(tab => {
              const active = activeSport === tab.id
              return (
                <Tab
                  key={tab.id}
                  ref={active ? activeTabRef : null}
                  $active={active}
                  aria-pressed={active}
                  onClick={() => setActiveSport(tab.id)}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </Tab>
              )
            })}
          </TabsRow>
          <TabsFade $side="left" $visible={showLeftFade} />
          <TabsFade $side="right" $visible={showRightFade} />
        </TabsWrapper>

        {/* Jogos disponíveis — conteúdo dominante */}
        <SectionBlock>
          <SectionHeader>
            <div>
              <SectionTitle>Jogos em destaque</SectionTitle>
              <SectionSubtitle>
                {filteredEvents.length} disponíve{filteredEvents.length !== 1 ? 'is' : 'l'} agora
              </SectionSubtitle>
            </div>
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

      </PageWrapper>
    </MainLayout>
  )
}
