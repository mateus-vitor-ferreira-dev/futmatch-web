import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Calendar, Clock, Copy, Plus } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { playerService } from '../../services/playerService'
import { MainLayout } from '../../components'
// Reutilizando os componentes de Grid e Card do QueroJogar para consistência
import { Grid, Card, CardHeader, InfoRow, ProgressBarContainer, ProgressBar, SpotsInfo } from '../QueroJogar/styles'
import { Container, PageHeader, CreateButton, Tabs, Tab, PixBox, ModalOverlay, ModalContent, Form, ButtonGroup } from './styles'

export default function MinhasPeladas() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('participating')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  
  // States do Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [courts, setCourts] = useState([])
  
  const { register, handleSubmit, reset } = useForm()

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = activeTab === 'participating' 
        ? await playerService.getMyParticipatingEvents() 
        : await playerService.getMyCreatedEvents()
      setEvents(res.data || [])
    } catch (error) {
      console.error('Erro ao buscar jogos', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourts = async () => {
    try {
      const res = await playerService.getCourts()
      setCourts(res.data || [])
    } catch (error) {
      console.error('Erro ao carregar quadras', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  useEffect(() => {
    if (isModalOpen) fetchCourts()
  }, [isModalOpen])

  const onSubmit = async (data) => {
    try {
      const payload = {
        date: new Date(`${data.date}T${data.time}:00`).toISOString(),
        maxPlayers: parseInt(data.maxPlayers),
        totalValue: parseFloat(data.totalValue),
        pixKey: data.pixKey
      }
      await playerService.createEvent(data.courtId, payload)
      setIsModalOpen(false)
      reset()
      setActiveTab('created')
      fetchData()
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao criar pelada')
    }
  }

  const copyPix = (key) => {
    navigator.clipboard.writeText(key)
    alert('Chave PIX copiada!')
  }

  return (
    <MainLayout user={user}>
      <Container>
        <PageHeader>
          <div>
            <h1>Meus Jogos</h1>
            <p>Gerencie os jogos que você criou ou está participando.</p>
          </div>
          <CreateButton onClick={() => setIsModalOpen(true)}>
            <Plus size={18} style={{display: 'inline', marginRight: 4, verticalAlign: 'middle'}}/>
            Criar Jogo
          </CreateButton>
        </PageHeader>

        <Tabs>
          <Tab $active={activeTab === 'participating'} onClick={() => setActiveTab('participating')}>
            Participando
          </Tab>
          <Tab $active={activeTab === 'created'} onClick={() => setActiveTab('created')}>
            Criados por mim
          </Tab>
        </Tabs>

        {loading ? <p>Carregando...</p> : (
          <Grid>
            {events.map((event) => {
              // Ajuste conforme o formato retornado pelas rotas 'my'
              const ev = event.pelada || event // Se for participation, o evento pode estar aninhado
              if (!ev || !ev.id) return null

              const currentPlayers = ev._count?.participations || 0
              const maxPlayers = ev.maxPlayers
              const progress = (currentPlayers / maxPlayers) * 100

              return (
                <Card key={ev.id}>
                  <CardHeader>
                    <div>
                      <h3>{ev.court?.place?.name || 'Local'}</h3>
                      <span style={{fontSize: 12, color: '#6b7280'}}>{ev.court?.name}</span>
                    </div>
                    <span className="badge" style={{color: '#f59e0b', background: '#fef3c7'}}>
                      {ev.status}
                    </span>
                  </CardHeader>

                  <InfoRow><Calendar /> {new Date(ev.date).toLocaleDateString('pt-BR')}</InfoRow>
                  <InfoRow><Clock /> {new Date(ev.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</InfoRow>

                  <ProgressBarContainer>
                    <ProgressBar $progress={progress}>
                      <div />
                    </ProgressBar>
                    <SpotsInfo>
                      <span>{currentPlayers} / {maxPlayers} confirmados</span>
                    </SpotsInfo>
                  </ProgressBarContainer>

                  {activeTab === 'created' && (
                    <PixBox>
                      <span>PIX: {ev.pixKey}</span>
                      <button onClick={() => copyPix(ev.pixKey)}><Copy size={14}/> Copiar</button>
                    </PixBox>
                  )}
                </Card>
              )
            })}
          </Grid>
        )}

        {/* Modal Criar Jogo */}
        {isModalOpen && (
          <ModalOverlay>
            <ModalContent>
              <h2>Criar Jogo</h2>
              <Form onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label>Quadra / Local</label>
                  <select {...register("courtId", { required: true })}>
                    <option value="">Selecione a quadra</option>
                    {courts.map(court => (
                      <option key={court.id} value={court.id}>
                        {court.place?.name} - {court.name} ({court.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{display: 'flex', gap: 16}}>
                  <div style={{flex: 1}}>
                    <label>Data</label>
                    <input type="date" {...register("date", { required: true })} />
                  </div>
                  <div style={{flex: 1}}>
                    <label>Horário</label>
                    <input type="time" {...register("time", { required: true })} />
                  </div>
                </div>

                <div style={{display: 'flex', gap: 16}}>
                  <div style={{flex: 1}}>
                    <label>Nº de Participantes</label>
                    <input type="number" {...register("maxPlayers", { required: true })} min="2" />
                  </div>
                  <div style={{flex: 1}}>
                    <label>Valor Total (R$)</label>
                    <input type="number" step="0.01" {...register("totalValue", { required: true })} />
                  </div>
                </div>

                <div>
                  <label>Chave PIX (Para receber)</label>
                  <input type="text" {...register("pixKey", { required: true })} placeholder="CPF, Email, Telefone..." />
                </div>

                <ButtonGroup>
                  <button type="button" className="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="submit">Criar jogo</button>
                </ButtonGroup>
              </Form>
            </ModalContent>
          </ModalOverlay>
        )}
      </Container>
    </MainLayout>
  )
}