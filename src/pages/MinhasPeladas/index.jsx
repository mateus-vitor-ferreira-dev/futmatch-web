import { useState, useEffect, useCallback } from 'react'
import { getSportMeta } from '../../hooks/useSports'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { SkeletonCard } from '../../components/Skeleton'
import { Calendar, Clock, Copy, Plus, Shuffle, Flag, XCircle, CheckSquare } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { playerService } from '../../services/playerService'
import { MainLayout } from '../../components'
import { Grid, Card, CardHeader, InfoRow, ProgressBarContainer, ProgressBar, SpotsInfo } from '../QueroJogar/styles'
import {
  Container, PageHeader, CreateButton, Tabs, Tab, PixBox,
  ModalOverlay, ModalContent, Form, ButtonGroup,
  DrawButton, DrawModalOverlay, DrawModalContent,
  TeamGrid, TeamCard, TeamHeader, PlayerItem,
} from './styles'

const STATUS_LABELS = {
  WAITING:   'Aguardando',
  FULL:      'Lotado',
  FINISHED:  'Finalizado',
  CANCELLED: 'Cancelado',
}

const TEAM_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#eab308', '#6366f1', '#06b6d4',
]

export default function MinhasPeladas() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('participating')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal criar jogo — inicializa a partir da URL para evitar flash
  const [isModalOpen, setIsModalOpen] = useState(() => searchParams.get('action') === 'criar')
  const [courts, setCourts] = useState([])

  // Sorteio
  const [drawEvent, setDrawEvent] = useState(null)
  const [teamCount, setTeamCount] = useState(2)
  const [drawResult, setDrawResult] = useState(null)
  const [drawLoading, setDrawLoading] = useState(false)

  // Presença
  const [attendanceEvent, setAttendanceEvent]           = useState(null)
  const [attendanceParticipants, setAttendanceParticipants] = useState([])
  const [attendanceMap, setAttendanceMap]               = useState({})
  const [loadingAttendance, setLoadingAttendance]       = useState(false)
  const [savingAttendance, setSavingAttendance]         = useState(false)

  const { register, handleSubmit, reset } = useForm()

  // Limpa o ?action=criar da URL após abrir o modal
  useEffect(() => {
    if (searchParams.get('action') === 'criar') {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const fetchData = useCallback(async () => {
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
  }, [activeTab])

  const fetchCourts = async () => {
    try {
      const res = await playerService.getCourts()
      setCourts(res.data || [])
    } catch (error) {
      console.error('Erro ao carregar quadras', error)
    }
  }

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { if (isModalOpen) fetchCourts() }, [isModalOpen])

  const onSubmit = async (data) => {
    try {
      const payload = {
        date: new Date(`${data.date}T${data.time}:00`).toISOString(),
        maxPlayers: parseInt(data.maxPlayers),
        totalValue: parseFloat(data.totalValue),
        pixKey: data.pixKey,
      }
      await playerService.createEvent(data.courtId, payload)
      setIsModalOpen(false)
      reset()
      setActiveTab('created')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao criar pelada')
    }
  }

  const copyPix = (key) => {
    navigator.clipboard.writeText(key)
    toast.success('Chave PIX copiada!')
  }

  const openDraw = (ev) => {
    setDrawEvent(ev)
    setTeamCount(2)
    setDrawResult(null)
  }

  const handleDraw = async () => {
    if (!drawEvent) return
    try {
      setDrawLoading(true)
      const res = await playerService.drawTeams(drawEvent.courtId, drawEvent.id, teamCount)
      setDrawResult(res.data)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao realizar sorteio. Verifique se há jogadores suficientes.')
    } finally {
      setDrawLoading(false)
    }
  }

  const closeDraw = () => {
    setDrawEvent(null)
    setDrawResult(null)
  }

  const openAttendance = async (ev) => {
    setAttendanceEvent(ev)
    setLoadingAttendance(true)
    try {
      const res = await playerService.getEventParticipants(ev.courtId, ev.id)
      const participants = res.data ?? res ?? []
      setAttendanceParticipants(participants)
      const initial = {}
      participants.forEach((p) => {
        initial[p.userId ?? p.user?.id] = p.attended !== false
      })
      setAttendanceMap(initial)
    } catch {
      toast.error('Erro ao carregar participantes.')
      setAttendanceEvent(null)
    } finally {
      setLoadingAttendance(false)
    }
  }

  const closeAttendance = () => {
    setAttendanceEvent(null)
    setAttendanceParticipants([])
    setAttendanceMap({})
  }

  const saveAttendance = async () => {
    if (!attendanceEvent) return
    setSavingAttendance(true)
    try {
      await Promise.all(
        attendanceParticipants.map((p) => {
          const uid = p.userId ?? p.user?.id
          return playerService.confirmAttendance(
            attendanceEvent.courtId, attendanceEvent.id, uid, attendanceMap[uid] ?? true
          )
        })
      )
      toast.success('Presenças confirmadas!')
      closeAttendance()
    } catch {
      toast.error('Erro ao salvar presenças.')
    } finally {
      setSavingAttendance(false)
    }
  }

  const handleUpdateStatus = async (ev, status) => {
    const label = status === 'FINISHED' ? 'finalizar' : 'cancelar'
    if (!window.confirm(`Tem certeza que deseja ${label} esta pelada?`)) return
    try {
      await playerService.updateEventStatus(ev.courtId, ev.id, status)
      toast.success(`Pelada ${status === 'FINISHED' ? 'finalizada' : 'cancelada'}.`)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar status.')
    }
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
            <Plus size={18} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
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

        {loading ? <SkeletonCard count={3} /> : (
          <Grid>
            {events.map((event) => {
              const ev = event.pelada || event
              if (!ev || !ev.id) return null

              const currentPlayers = ev._count?.participations || 0
              const maxPlayers = ev.maxPlayers
              const progress = (currentPlayers / maxPlayers) * 100

              return (
                <Card key={ev.id} onClick={() => navigate(`/pelada/${ev.id}`)} style={{ cursor: 'pointer' }}>
                  <CardHeader>
                    <div>
                      <h3>{ev.court?.place?.name || 'Local'}</h3>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{ev.court?.name}</span>
                    </div>
                    <span className="badge" style={{ color: '#f59e0b', background: '#fef3c7' }}>
                      {STATUS_LABELS[ev.status] ?? ev.status}
                    </span>
                  </CardHeader>

                  <InfoRow><Calendar /> {new Date(ev.date).toLocaleDateString('pt-BR')}</InfoRow>
                  <InfoRow><Clock /> {new Date(ev.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</InfoRow>

                  <ProgressBarContainer>
                    <ProgressBar $progress={progress}><div /></ProgressBar>
                    <SpotsInfo><span>{currentPlayers} / {maxPlayers} confirmados</span></SpotsInfo>
                  </ProgressBarContainer>

                  {activeTab === 'created' && (
                    <>
                      <PixBox>
                        <span>PIX: {ev.pixKey}</span>
                        <button onClick={() => copyPix(ev.pixKey)}><Copy size={14} /> Copiar</button>
                      </PixBox>
                      {(ev.status === 'WAITING' || ev.status === 'FULL') && (
                        <>
                          <DrawButton onClick={() => openDraw(ev)}>
                            <Shuffle size={14} /> Sortear Times
                          </DrawButton>
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button
                              onClick={() => handleUpdateStatus(ev, 'FINISHED')}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f0fdf4', color: '#166534', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                            >
                              <Flag size={13} /> Finalizar
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(ev, 'CANCELLED')}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fee2e2', color: '#991b1b', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                            >
                              <XCircle size={13} /> Cancelar
                            </button>
                          </div>
                        </>
                      )}
                      {ev.status === 'FINISHED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openAttendance(ev) }}
                          style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid #3b82f6', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                        >
                          <CheckSquare size={13} /> Confirmar Presenças
                        </button>
                      )}
                    </>
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
                  <select {...register('courtId', { required: true })}>
                    <option value="">Selecione a quadra</option>
                    {courts.map(court => (
                      <option key={court.id} value={court.id}>
                        {court.place?.name} - {court.name} ({getSportMeta(court.type).icon} {getSportMeta(court.type).label})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label>Data</label>
                    <input type="date" {...register('date', { required: true })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Horário</label>
                    <input type="time" {...register('time', { required: true })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label>Nº de Participantes</label>
                    <input type="number" {...register('maxPlayers', { required: true })} min="2" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Valor Total (R$)</label>
                    <input type="number" step="0.01" {...register('totalValue', { required: true })} />
                  </div>
                </div>
                <div>
                  <label>Chave PIX (Para receber)</label>
                  <input type="text" {...register('pixKey', { required: true })} placeholder="CPF, Email, Telefone..." />
                </div>
                <ButtonGroup>
                  <button type="button" className="cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="submit">Criar jogo</button>
                </ButtonGroup>
              </Form>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Modal Sorteio de Times */}
        {drawEvent && (
          <DrawModalOverlay onClick={closeDraw}>
            <DrawModalContent onClick={e => e.stopPropagation()}>
              {!drawResult ? (
                <>
                  <h2>Sortear Times</h2>
                  <p style={{ color: '#6b7280', marginBottom: 24 }}>
                    {drawEvent.court?.place?.name} &mdash; {new Date(drawEvent.date).toLocaleDateString('pt-BR')}
                  </p>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#111827' }}>
                      Quantos times?
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <input
                        type="range"
                        min="2"
                        max="10"
                        value={teamCount}
                        onChange={e => setTeamCount(Number(e.target.value))}
                        style={{ flex: 1, accentColor: '#22c55e', height: 6 }}
                      />
                      <span style={{ fontWeight: 700, fontSize: 28, color: '#22c55e', minWidth: 40, textAlign: 'center' }}>
                        {teamCount}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
                      Os jogadores serão distribuídos aleatoriamente entre {teamCount} times.
                    </p>
                  </div>

                  <ButtonGroup>
                    <button type="button" className="cancel" onClick={closeDraw}>Cancelar</button>
                    <button
                      type="button"
                      className="submit"
                      onClick={handleDraw}
                      disabled={drawLoading}
                    >
                      {drawLoading ? 'Sorteando...' : '⚽ Sortear!'}
                    </button>
                  </ButtonGroup>
                </>
              ) : (
                <>
                  <h2>Times Sorteados</h2>
                  <p style={{ color: '#6b7280', marginBottom: 24 }}>
                    {drawResult.totalPlayers} jogadores distribuídos em {drawResult.teamCount} times
                  </p>

                  <TeamGrid>
                    {drawResult.teams.map((team, idx) => (
                      <TeamCard key={idx} $color={TEAM_COLORS[idx % TEAM_COLORS.length]}>
                        <TeamHeader $color={TEAM_COLORS[idx % TEAM_COLORS.length]}>
                          {team.name}
                        </TeamHeader>
                        {team.players.map(p => (
                          <PlayerItem key={p.id}>
                            <div className="avatar">{p.name?.charAt(0)?.toUpperCase()}</div>
                            <span>{p.name}</span>
                          </PlayerItem>
                        ))}
                      </TeamCard>
                    ))}
                  </TeamGrid>

                  <button
                    onClick={closeDraw}
                    style={{
                      width: '100%', marginTop: 16, padding: 12,
                      borderRadius: 10, background: '#22c55e', color: 'white',
                      fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 15,
                    }}
                  >
                    Fechar
                  </button>
                </>
              )}
            </DrawModalContent>
          </DrawModalOverlay>
        )}
        {/* Modal Confirmar Presenças */}
        {attendanceEvent && (
          <DrawModalOverlay onClick={closeAttendance}>
            <DrawModalContent onClick={(e) => e.stopPropagation()}>
              <h2>Confirmar Presenças</h2>
              <p style={{ color: '#6b7280', marginBottom: 20 }}>
                {attendanceEvent.court?.place?.name} — {new Date(attendanceEvent.date).toLocaleDateString('pt-BR')}
              </p>

              {loadingAttendance ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: 24 }}>Carregando participantes...</p>
              ) : attendanceParticipants.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: 24 }}>Nenhum participante encontrado.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, maxHeight: 320, overflowY: 'auto' }}>
                  {attendanceParticipants.map((p) => {
                    const uid = p.userId ?? p.user?.id
                    const name = p.user?.name ?? p.name ?? uid
                    const present = attendanceMap[uid] ?? true
                    return (
                      <div
                        key={uid}
                        onClick={() => setAttendanceMap((m) => ({ ...m, [uid]: !present }))}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                          border: `1px solid ${present ? '#22c55e' : '#e5e7eb'}`,
                          background: present ? '#f0fdf4' : '#f9fafb',
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{name}</span>
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                          background: present ? '#dcfce7' : '#f3f4f6',
                          color: present ? '#15803d' : '#6b7280',
                        }}>
                          {present ? 'Presente' : 'Ausente'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              <ButtonGroup>
                <button type="button" className="cancel" onClick={closeAttendance}>Cancelar</button>
                <button
                  type="button"
                  className="submit"
                  onClick={saveAttendance}
                  disabled={savingAttendance || loadingAttendance || attendanceParticipants.length === 0}
                >
                  {savingAttendance ? 'Salvando...' : 'Salvar Presenças'}
                </button>
              </ButtonGroup>
            </DrawModalContent>
          </DrawModalOverlay>
        )}
      </Container>
    </MainLayout>
  )
}
