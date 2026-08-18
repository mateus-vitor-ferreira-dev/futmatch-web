import { useState, useMemo } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Search, Calendar, Clock, CheckCircle, MapPin, SlidersHorizontal, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { playerService } from '../../services/playerService'
import { chaves } from '../../lib/queryClient'
import { useSports, getSportMeta } from '../../hooks/useSports'
import { SkeletonCard } from '../../components/Skeleton'
import { mensagemDeErro } from '../../utils/apiError'
import type { EventFilters } from '../../services/events'
import type { CourtType, Pelada } from '../../types/api'
import type { SportOption } from '../../hooks/useSports'
import {
  Container, Header, HeaderRow,
  FiltersArea, SearchInput, ChipsContainer, Chip, ResultsCount,
  SportBtnsRow, SportAllBtn, SportSelectWrapper,
  Grid, Card, CardHeader, InfoRow, ProgressBarContainer, ProgressBar,
  SpotsInfo, PriceInfo, ActionButton,
  AdvancedFilters, FilterRow, FilterGroup, FilterLabel,
  FilterSelect, FilterToggle, FiltersBtn, ActiveFilterBadge, ClearBtn,
  PriceSliderWrapper,
} from './styles'

function buildGoogleMapsUrl(event: Pelada): string | null {
  const parts = [
    // `street` não vem no select de place deste endpoint.
    event.court?.place?.name,
    event.court?.place?.neighborhood,
    event.court?.place?.city,
    'Brasil',
  ].filter(Boolean)
  if (parts.length === 0) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`
}

const TIME_OPTIONS = [
  { id: 'manha',  label: '🌅 Manhã',   from: 5,  to: 12 },
  { id: 'tarde',  label: '☀️ Tarde',   from: 12, to: 18 },
  { id: 'noite',  label: '🌙 Noite',   from: 18, to: 24 },
]

const MAX_PRICE = 200

export default function QueroJogar() {
  const { user } = useAuth()
  const { sports: allSports } = useSports()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch]             = useState('')
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || '')
  const [showFilters, setShowFilters]   = useState(false)
  const [filterTime, setFilterTime]     = useState('')
  const [filterMaxPrice, setFilterMaxPrice] = useState(MAX_PRICE)
  const [filterArena, setFilterArena]   = useState('')
  const [filterCity, setFilterCity]     = useState('')
  const [filterVagas, setFilterVagas]   = useState(false)

  /*
   * courtType e city são filtros server-side: entram na chave de cache, então
   * mudar de filtro busca do zero e voltar a um filtro já visto vem do cache,
   * sem rede. O `useInfiniteQuery` guarda as páginas acumuladas — antes elas
   * viviam num useState que sumia ao trocar de rota, e voltar para cá recomeçava
   * da página 1.
   */
  const filtrosServidor = { courtType: selectedSport || undefined, city: filterCity || undefined }

  const {
    data: paginas,
    isPending: loading,
    isFetchingNextPage: loadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: chaves.eventos.busca(filtrosServidor),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const params: EventFilters = { status: 'WAITING', page: pageParam, limit: 20 }
      if (selectedSport) params.courtType = selectedSport as CourtType
      if (filterCity)    params.city      = filterCity
      const res = await playerService.searchEvents(params)
      return {
        eventos: (res.data?.events ?? res.data ?? []) as Pelada[],
        temMais: res.data?.hasMore ?? false,
      }
    },
    // `undefined` diz ao react-query que acabou — é o que apaga o botão.
    getNextPageParam: (ultima, todas) => (ultima.temMais ? todas.length + 1 : undefined),
  })

  const events = useMemo(() => paginas?.pages.flatMap((p) => p.eventos) ?? [], [paginas])

  const cities = useMemo(() =>
    [...new Set(events.map(e => e.court?.place?.city).filter(Boolean))].sort(),
    [events]
  )

  const arenas = useMemo(() =>
    [...new Set(events.map(e => e.court?.place?.name).filter(Boolean))].sort(),
    [events]
  )

  const filteredEvents = events.filter(e => {
    const matchesSearch =
      e.court?.place?.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.court?.place?.neighborhood?.toLowerCase().includes(search.toLowerCase())

    const matchesSport = selectedSport ? e.court?.type === selectedSport : true

    const hour = new Date(e.date).getHours()
    const matchesTime =
      !filterTime ? true :
      filterTime === 'manha' ? hour >= 5 && hour < 12 :
      filterTime === 'tarde' ? hour >= 12 && hour < 18 :
      hour >= 18 || hour < 5

    const pricePerPerson = Number(e.totalValue) / e.maxPlayers
    const matchesPrice = filterMaxPrice >= MAX_PRICE ? true : pricePerPerson <= filterMaxPrice

    const matchesArena = !filterArena ? true : e.court?.place?.name === filterArena
    const matchesCity = !filterCity ? true : e.court?.place?.city === filterCity

    const currentPlayers = e._count?.participations || 0
    const matchesVagas = !filterVagas ? true : currentPlayers < e.maxPlayers

    return matchesSearch && matchesSport && matchesTime && matchesPrice && matchesArena && matchesCity && matchesVagas
  })

  const activeFilterCount = [
    selectedSport,
    filterTime,
    filterMaxPrice < MAX_PRICE ? String(filterMaxPrice) : '',
    filterArena,
    filterCity,
    filterVagas,
  ].filter(Boolean).length

  function clearFilters() {
    setSelectedSport('')
    setFilterTime('')
    setFilterMaxPrice(MAX_PRICE)
    setFilterArena('')
    setFilterCity('')
    setFilterVagas(false)
  }

  const handleJoin = async (courtId: string, eventId: string) => {
    try {
      await playerService.joinEvent(courtId, eventId)
      queryClient.invalidateQueries({ queryKey: ['eventos'] })
    } catch (error) {
      toast.error(mensagemDeErro(error, 'Erro ao entrar no jogo'))
    }
  }

  return (
    <>
      <Container>
        <HeaderRow>
          <Header>
            <h1>Quero Jogar</h1>
            <p>Encontre a partida perfeita para você participar hoje.</p>
          </Header>
        </HeaderRow>

        <FiltersArea>
          {/* Busca + botão de filtros */}
          <div style={{ display: 'flex', gap: 12 }}>
            <SearchInput style={{ flex: 1 }}>
              <Search size={20} />
              <input
                placeholder="Pesquisar por local ou bairro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </SearchInput>
            <FiltersBtn
              $active={activeFilterCount > 0}
              onClick={() => setShowFilters(v => !v)}
            >
              <SlidersHorizontal size={16} />
              Filtros
              {activeFilterCount > 0 && (
                <ActiveFilterBadge>{activeFilterCount}</ActiveFilterBadge>
              )}
            </FiltersBtn>
          </div>

          {/* Esporte — 2 botões */}
          <SportBtnsRow>
            <SportAllBtn
              $active={selectedSport === ''}
              onClick={() => setSelectedSport('')}
            >
              🎯 Todas as modalidades
            </SportAllBtn>
            <SportSelectWrapper $active={selectedSport !== ''}>
              <span>
                {selectedSport
                  ? `${allSports.find(s => s.id === selectedSport)?.icon ?? ''} ${allSports.find(s => s.id === selectedSport)?.label ?? ''}`
                  : '⚽ Selecionar modalidade'}
                {' ▾'}
              </span>
              <select
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
              >
                <option value="">Selecionar modalidade</option>
                {allSports.map((sport: SportOption) => (
                  <option key={sport.id} value={sport.id}>{sport.icon} {sport.label}</option>
                ))}
              </select>
            </SportSelectWrapper>
          </SportBtnsRow>

          {/* Filtros avançados */}
          {showFilters && (
            <AdvancedFilters>
              <FilterRow>
                <FilterGroup>
                  <FilterLabel>Modalidade</FilterLabel>
                  <FilterSelect
                    value={selectedSport}
                    onChange={e => setSelectedSport(e.target.value)}
                  >
                    <option value="">Todas as modalidades</option>
                    {allSports.map((sport: SportOption) => (
                      <option key={sport.id} value={sport.id}>{sport.icon} {sport.label}</option>
                    ))}
                  </FilterSelect>
                </FilterGroup>

                <FilterGroup>
                  <FilterLabel>Horário</FilterLabel>
                  <ChipsContainer style={{ paddingBottom: 0 }}>
                    {TIME_OPTIONS.map(t => (
                      <Chip
                        key={t.id}
                        $active={filterTime === t.id}
                        onClick={() => setFilterTime(filterTime === t.id ? '' : t.id)}
                      >
                        {t.label}
                      </Chip>
                    ))}
                  </ChipsContainer>
                </FilterGroup>

                <FilterGroup>
                  <FilterLabel>Preço máximo / pessoa</FilterLabel>
                  <PriceSliderWrapper $pct={filterMaxPrice >= MAX_PRICE ? 100 : (filterMaxPrice / MAX_PRICE) * 100}>
                    <input
                      type="range"
                      min={0}
                      max={MAX_PRICE}
                      step={5}
                      value={filterMaxPrice}
                      onChange={e => setFilterMaxPrice(Number(e.target.value))}
                    />
                    <span>
                      {filterMaxPrice >= MAX_PRICE
                        ? 'Qualquer preço'
                        : `Até R$ ${filterMaxPrice}`}
                    </span>
                  </PriceSliderWrapper>
                </FilterGroup>
              </FilterRow>

              <FilterRow>
                <FilterGroup>
                  <FilterLabel>Arena / Estabelecimento</FilterLabel>
                  <FilterSelect
                    value={filterArena}
                    onChange={e => setFilterArena(e.target.value)}
                  >
                    <option value="">Todos os estabelecimentos</option>
                    {arenas.map(arena => (
                      <option key={arena} value={arena}>{arena}</option>
                    ))}
                  </FilterSelect>
                </FilterGroup>

                <FilterGroup>
                  <FilterLabel>Cidade</FilterLabel>
                  <FilterSelect
                    value={filterCity}
                    onChange={e => setFilterCity(e.target.value)}
                  >
                    <option value="">Todas as cidades</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </FilterSelect>
                </FilterGroup>

                <FilterGroup style={{ justifyContent: 'flex-end' }}>
                  <FilterToggle
                    $active={filterVagas}
                    onClick={() => setFilterVagas(v => !v)}
                  >
                    <span className="toggle-track">
                      <span className="toggle-thumb" />
                    </span>
                    Com vagas disponíveis
                  </FilterToggle>
                </FilterGroup>

                {activeFilterCount > 0 && (
                  <ClearBtn onClick={clearFilters}>
                    <X size={14} /> Limpar filtros
                  </ClearBtn>
                )}
              </FilterRow>
            </AdvancedFilters>
          )}
        </FiltersArea>

        <ResultsCount>
          {loading
            ? 'Buscando jogos...'
            : `${filteredEvents.length} jogo${filteredEvents.length !== 1 ? 's' : ''} encontrado${filteredEvents.length !== 1 ? 's' : ''}`
          }
        </ResultsCount>

        <Grid>
          {loading ? <SkeletonCard count={3} /> : filteredEvents.map((event: Pelada) => {
            const currentPlayers = event._count?.participations || 0
            const maxPlayers = event.maxPlayers
            const progress = (currentPlayers / maxPlayers) * 100
            const isFull = currentPlayers >= maxPlayers
            const isJoined = event.participations?.some(p => p.userId === user?.id)
            const pricePerPerson = (Number(event.totalValue) / maxPlayers).toFixed(2)
            const mapsUrl = buildGoogleMapsUrl(event)

            return (
              <Card key={event.id} onClick={() => navigate(`/pelada/${event.id}`)} style={{ cursor: 'pointer' }}>
                <CardHeader>
                  <div>
                    <h3>{event.court?.place?.name || 'Local'}</h3>
                    <span className="address">
                      {/* `street` não vem no select de place — renderizava "undefined, Bairro". */}
                      {event.court?.place?.neighborhood}, {event.court?.place?.city}
                    </span>
                  </div>
                  <span className="badge">{getSportMeta(event.court?.type as CourtType).icon} {getSportMeta(event.court?.type as CourtType).label}</span>
                </CardHeader>

                <InfoRow><Calendar size={14} /> {new Date(event.date).toLocaleDateString('pt-BR')}</InfoRow>
                <InfoRow>
                  <Clock size={14} />
                  {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </InfoRow>
                {mapsUrl && (
                  <InfoRow as="a" href={mapsUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'none', cursor: 'pointer' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <MapPin size={14} /> Ver no Google Maps
                  </InfoRow>
                )}

                <ProgressBarContainer>
                  <ProgressBar $progress={progress} $isFull={isFull}>
                    <div />
                  </ProgressBar>
                  <SpotsInfo>
                    <span>{currentPlayers} / {maxPlayers} confirmados</span>
                    <span>{maxPlayers - currentPlayers} vagas restantes</span>
                  </SpotsInfo>
                </ProgressBarContainer>

                <PriceInfo>R$ {pricePerPerson} / pessoa</PriceInfo>

                <ActionButton
                  disabled={isFull || isJoined}
                  $isJoined={isJoined}
                  onClick={(e) => { e.stopPropagation(); handleJoin(event.courtId, event.id) }}
                >
                  {isJoined
                    ? <><CheckCircle size={18} /> Você entrou</>
                    : isFull ? 'Jogo lotado' : 'Entrar no jogo'}
                </ActionButton>
              </Card>
            )
          })}
          </Grid>

        {hasMore && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
            <button
              onClick={() => fetchNextPage()}
              disabled={loadingMore}
              style={{
                padding: '12px 32px',
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 15,
                cursor: loadingMore ? 'not-allowed' : 'pointer',
                opacity: loadingMore ? 0.7 : 1,
              }}
            >
              {loadingMore ? 'Carregando...' : 'Carregar mais jogos'}
            </button>
          </div>
        )}
      </Container>
    </>
  )
}
