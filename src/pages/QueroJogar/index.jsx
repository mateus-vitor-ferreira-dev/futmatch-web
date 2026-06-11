import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Calendar, Clock, CheckCircle, MapPin } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { playerService } from '../../services/playerService'
import { useSports } from '../../hooks/useSports'
import { MainLayout } from '../../components'
import {
  Container, Header, HeaderRow,
  FiltersArea, SearchInput, ChipsContainer, Chip, ResultsCount,
  Grid, Card, CardHeader, InfoRow, ProgressBarContainer, ProgressBar,
  SpotsInfo, PriceInfo, ActionButton,
} from './styles'

function buildGoogleMapsUrl(event) {
  const parts = [
    event.court?.place?.street,
    event.court?.place?.neighborhood,
    event.court?.place?.city,
    'Brasil',
  ].filter(Boolean)
  if (parts.length === 0) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`
}

export default function QueroJogar() {
  const { user } = useAuth()
  const { tabs: sportTabs } = useSports()
  const [searchParams] = useSearchParams()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || '')

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

  const activeTab = sportTabs.find(t => t.id === selectedSport)
  const filteredEvents = events.filter(e => {
    const matchesSearch =
      e.court?.place?.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.court?.place?.neighborhood?.toLowerCase().includes(search.toLowerCase())
    const matchesSport = selectedSport ? activeTab?.types?.includes(e.court?.type) : true
    return matchesSearch && matchesSport
  })

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
            <Chip $active={selectedSport === ''} onClick={() => setSelectedSport('')}>
              Todos
            </Chip>
            {sportTabs.map(tab => (
              <Chip
                key={tab.id}
                $active={selectedSport === tab.id}
                onClick={() => setSelectedSport(tab.id)}
              >
                {tab.label}
              </Chip>
            ))}
          </ChipsContainer>
        </FiltersArea>

        <ResultsCount>
          {loading
            ? 'Buscando jogos...'
            : `${filteredEvents.length} jogo${filteredEvents.length !== 1 ? 's' : ''} encontrado${filteredEvents.length !== 1 ? 's' : ''}`
          }
        </ResultsCount>

        <Grid>
          {filteredEvents.map((event) => {
            const currentPlayers = event._count?.participations || 0
            const maxPlayers = event.maxPlayers
            const progress = (currentPlayers / maxPlayers) * 100
            const isFull = currentPlayers >= maxPlayers
            const isJoined = event.participations?.some(p => p.userId === user?.id)
            const pricePerPerson = (Number(event.totalValue) / maxPlayers).toFixed(2)
            const mapsUrl = buildGoogleMapsUrl(event)

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

                <InfoRow><Calendar size={14} /> {new Date(event.date).toLocaleDateString('pt-BR')}</InfoRow>
                <InfoRow>
                  <Clock size={14} />
                  {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </InfoRow>
                {mapsUrl && (
                  <InfoRow as="a" href={mapsUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'none', cursor: 'pointer' }}
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
      </Container>
    </MainLayout>
  )
}
