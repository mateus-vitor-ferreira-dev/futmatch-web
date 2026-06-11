import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Calendar, Clock, CheckCircle, LayoutList, Map as MapIcon, Loader } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { playerService } from '../../services/playerService'
import { MainLayout } from '../../components'
import { Map } from '../../components/Map'
import {
  Container, Header, HeaderRow, ViewToggle, ToggleBtn,
  FiltersArea, SearchInput, ChipsContainer, Chip, ResultsCount,
  Grid, Card, CardHeader, InfoRow, ProgressBarContainer, ProgressBar,
  SpotsInfo, PriceInfo, ActionButton, MapWrapper,
} from './styles'

// ── Geocoding via OpenStreetMap Nominatim ─────────────────────────────────────

const GEO_CACHE_KEY = 'futmatch:geocache'

function loadGeoCache() {
  try { return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || '{}') }
  catch { return {} }
}

async function geocodeAddress(address) {
  if (!address) return null
  const cache = loadGeoCache()
  if (cache[address]) return cache[address]

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR,pt' } })
    const [hit] = await res.json()
    if (!hit) return null
    const coords = { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) }
    const updated = loadGeoCache()
    updated[address] = coords
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(updated))
    return coords
  } catch {
    return null
  }
}

function buildAddress(event) {
  const parts = [
    event.court?.place?.street,
    event.court?.place?.neighborhood,
    event.court?.place?.city,
    'Brasil',
  ].filter(Boolean)
  return parts.length > 1 ? parts.join(', ') : null
}

// ─────────────────────────────────────────────────────────────────────────────

const SPORTS_FILTERS = [
  { label: 'Todos',        value: '' },
  { label: 'Futebol',      value: 'SOCIETY' },
  { label: 'Futevôlei',    value: 'AREIA' },
  { label: 'Vôlei',        value: 'VOLEI' },
  { label: 'Beach Tennis', value: 'BEACH_TENNIS' },
]

function normalizeForMap(event, coordsCache) {
  const lat = event.court?.place?.latitude
    ?? event.court?.place?.lat
    ?? null

  const lng = event.court?.place?.longitude
    ?? event.court?.place?.lng
    ?? null

  // Se não tem no evento, tenta no cache
  const address = buildAddress(event)
  const cached = (lat == null && address) ? coordsCache[address] : null

  return {
    id:             event.id,
    courtName:      event.court?.name || 'Quadra',
    type:           event.court?.type || '',
    place:          event.court?.place?.name || '',
    city:           event.court?.place?.city || '',
    maxPlayers:     event.maxPlayers,
    participations: event._count?.participations || 0,
    totalValue:     String(event.totalValue || 0),
    status:         event.status,
    lat:            lat ?? cached?.lat ?? null,
    lng:            lng ?? cached?.lng ?? null,
  }
}

export default function QueroJogar() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || '')
  const [view, setView] = useState('list')

  // Geocoding
  const [coordsCache, setCoordsCache] = useState(loadGeoCache)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodingProgress, setGeocodingProgress] = useState({ done: 0, total: 0 })
  const geocodingRef = useRef(false)

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const res = await playerService.searchEvents({ status: 'WAITING' })
      setEvents(res.data || [])
    } catch (error) {
      console.error('Erro ao buscar jogos', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  const filteredEvents = events.filter(e => {
    const matchesSearch =
      e.court?.place?.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.court?.place?.neighborhood?.toLowerCase().includes(search.toLowerCase())
    const matchesSport = selectedSport ? e.court?.type === selectedSport : true
    return matchesSearch && matchesSport
  })

  // Eventos já prontos para o mapa (com coordenadas no cache ou no evento)
  const mapEvents = filteredEvents
    .map(e => normalizeForMap(e, coordsCache))
    .filter(e => e.lat != null && e.lng != null)

  // Geocoding automático ao entrar na vista de mapa
  useEffect(() => {
    if (view !== 'map' || filteredEvents.length === 0) return
    if (geocodingRef.current) return

    const eventsToGeocode = filteredEvents.filter(e => {
      const mapped = normalizeForMap(e, coordsCache)
      if (mapped.lat != null) return false       // já tem coords
      const addr = buildAddress(e)
      return addr && !coordsCache[addr]           // não está no cache
    })

    if (eventsToGeocode.length === 0) return

    geocodingRef.current = true
    setGeocoding(true)
    setGeocodingProgress({ done: 0, total: eventsToGeocode.length })

    const run = async () => {
      let done = 0
      for (const event of eventsToGeocode) {
        const address = buildAddress(event)
        const coords = await geocodeAddress(address)
        done++
        setGeocodingProgress({ done, total: eventsToGeocode.length })
        if (coords) {
          setCoordsCache(prev => ({ ...prev, [address]: coords }))
        }
        // Respeita o limite de 1 req/s do Nominatim
        await new Promise(r => setTimeout(r, 1100))
      }
      setGeocoding(false)
      geocodingRef.current = false
    }

    run()
  }, [view, filteredEvents.length, selectedSport, search])

  const handleJoin = async (courtId, eventId) => {
    try {
      await playerService.joinEvent(courtId, eventId)
      fetchEvents()
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao entrar no jogo')
    }
  }

  return (
    <MainLayout user={user}>
      <Container>
        <HeaderRow>
          <Header>
            <h1>Quero Jogar</h1>
            <p>Encontre a pelada perfeita para você participar hoje.</p>
          </Header>

          <ViewToggle>
            <ToggleBtn $active={view === 'list'} onClick={() => setView('list')}>
              <LayoutList size={16} />
              Lista
            </ToggleBtn>
            <ToggleBtn $active={view === 'map'} onClick={() => setView('map')}>
              <MapIcon size={16} />
              Mapa
            </ToggleBtn>
          </ViewToggle>
        </HeaderRow>

        <FiltersArea>
          <SearchInput>
            <Search size={20} />
            <input
              placeholder="Pesquisar por local ou bairro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchInput>

          <ChipsContainer>
            {SPORTS_FILTERS.map(sport => (
              <Chip
                key={sport.label}
                $active={selectedSport === sport.value}
                onClick={() => setSelectedSport(sport.value)}
              >
                {sport.label}
              </Chip>
            ))}
          </ChipsContainer>
        </FiltersArea>

        <ResultsCount>
          {loading ? 'Buscando jogos...' : view === 'list'
            ? `${filteredEvents.length} jogo${filteredEvents.length !== 1 ? 's' : ''} encontrado${filteredEvents.length !== 1 ? 's' : ''}`
            : geocoding
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Buscando localização... ({geocodingProgress.done}/{geocodingProgress.total})
                </span>
              : `${mapEvents.length} jogo${mapEvents.length !== 1 ? 's' : ''} no mapa`
          }
        </ResultsCount>

        {view === 'list' ? (
          <Grid>
            {filteredEvents.map((event) => {
              const currentPlayers = event._count?.participations || 0
              const maxPlayers = event.maxPlayers
              const progress = (currentPlayers / maxPlayers) * 100
              const isFull = currentPlayers >= maxPlayers
              const isJoined = event.participations?.some(p => p.userId === user?.id)
              const pricePerPerson = (Number(event.totalValue) / maxPlayers).toFixed(2)

              return (
                <Card key={event.id}>
                  <CardHeader>
                    <div>
                      <h3>{event.court?.place?.name || 'Local'}</h3>
                      <span className="address">
                        {event.court?.place?.street}, {event.court?.place?.neighborhood}
                      </span>
                    </div>
                    <span className="badge">{event.court?.type?.replace('_', ' ')}</span>
                  </CardHeader>

                  <InfoRow><Calendar /> {new Date(event.date).toLocaleDateString('pt-BR')}</InfoRow>
                  <InfoRow>
                    <Clock />
                    {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </InfoRow>

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
                    onClick={() => handleJoin(event.courtId, event.id)}
                  >
                    {isJoined
                      ? <><CheckCircle size={18} /> Você entrou</>
                      : isFull ? 'Jogo lotado' : 'Entrar no jogo'}
                  </ActionButton>
                </Card>
              )
            })}
          </Grid>
        ) : (
          <MapWrapper>
            <Map events={mapEvents} />
          </MapWrapper>
        )}
      </Container>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </MainLayout>
  )
}
