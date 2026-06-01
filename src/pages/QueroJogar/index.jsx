import { useState, useEffect } from 'react'
import { Search, MapPin, Calendar, Clock, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { playerService } from '../../services/playerService'
import { MainLayout } from '../../components'
import { 
  Container, Header, FiltersArea, SearchInput, ChipsContainer, Chip, ResultsCount,
  Grid, Card, CardHeader, InfoRow, ProgressBarContainer, ProgressBar, SpotsInfo, PriceInfo, ActionButton 
} from './styles'

const SPORTS_FILTERS = [
  { label: 'Todos', value: '' },
  { label: 'Futebol', value: 'SOCIETY' }, // Ou CAMPO, dependendo do seed
  { label: 'Futevôlei', value: 'AREIA' },
  { label: 'Vôlei', value: 'VOLEI' },
  { label: 'Beach Tennis', value: 'BEACH_TENNIS' },
]

export default function QueroJogar() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSport, setSelectedSport] = useState('')

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

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleJoin = async (courtId, eventId) => {
    try {
      await playerService.joinEvent(courtId, eventId)
      fetchEvents() // Recarrega para atualizar vaga e status
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao entrar no jogo')
    }
  }

  const filteredEvents = events.filter(e => {
    const matchesSearch = 
      e.court?.place?.name.toLowerCase().includes(search.toLowerCase()) ||
      e.court?.place?.neighborhood?.toLowerCase().includes(search.toLowerCase());
    
    const matchesSport = selectedSport ? e.court?.type === selectedSport : true;
    
    return matchesSearch && matchesSport;
  })

  return (
    <MainLayout user={user}>
      <Container>
        <Header>
          <h1>Quero Jogar</h1>
          <p>Encontre a pelada perfeita para você participar hoje.</p>
        </Header>

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
          {loading ? 'Buscando jogos...' : `${filteredEvents.length} jogos encontrados`}
        </ResultsCount>

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
                    <span className="address">{event.court?.place?.street}, {event.court?.place?.neighborhood}</span>
                  </div>
                  <span className="badge">{event.court?.type?.replace('_', ' ')}</span>
                </CardHeader>

                <InfoRow><Calendar /> {new Date(event.date).toLocaleDateString('pt-BR')}</InfoRow>
                <InfoRow><Clock /> {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</InfoRow>

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
                  {isJoined ? <><CheckCircle size={18}/> Você entrou</> : isFull ? 'Jogo lotado' : 'Entrar no jogo'}
                </ActionButton>
              </Card>
            )
          })}
        </Grid>
      </Container>
    </MainLayout>
  )
}