import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSportMeta } from '../../hooks/useSports'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { SkeletonCard } from '../../components/Skeleton'
import { Calendar, Clock, Copy, Plus, Shuffle, Flag, XCircle, CheckSquare } from 'lucide-react'
import { playerService } from '../../services/playerService'
import { chaves } from '../../lib/queryClient'
import { Grid, Card, CardHeader, InfoRow, ProgressBarContainer, ProgressBar, SpotsInfo } from '../QueroJogar/styles'
import { mensagemDeErro } from '../../utils/apiError'
import type { Court, DrawResult, DrawTeam, Participation, Pelada, PeladaStatus } from '../../types/api'
import {
  Container, PageHeader, CreateButton, Tabs, Tab, PixBox,
  ModalOverlay, ModalContent, Form, ButtonGroup,
  DrawButton, DrawModalOverlay, DrawModalContent,
  TeamGrid, TeamCard, TeamHeader, PlayerItem,
  DrawResultHeader, TeamVersus, VersusMark,
} from './styles'

const STATUS_LABELS: Record<string, string> = {
  WAITING:   'Aguardando',
  FULL:      'Lotado',
  FINISHED:  'Finalizado',
  CANCELLED: 'Cancelado',
}

const TEAM_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#eab308', '#6366f1', '#06b6d4',
]

/**
 * Um time do sorteio. Existe para que o layout de confronto (2 times, com o ✕
 * no meio) e a grade (3+ times) montem o mesmo cartão sem duplicar o JSX.
 */
function CartaoDoTime({ time, indice }: { time: DrawTeam; indice: number }) {
  const cor = TEAM_COLORS[indice % TEAM_COLORS.length]

  return (
    <TeamCard $color={cor}>
      <TeamHeader $color={cor}>{time.name}</TeamHeader>
      {time.players.map(p => (
        <PlayerItem key={p.id}>
          <div className="avatar">{p.name?.charAt(0)?.toUpperCase()}</div>
          <span>{p.name}</span>
        </PlayerItem>
      ))}
    </TeamCard>
  )
}

interface FormularioPelada {
  date: string
  time: string
  maxPlayers: string
  totalValue: string
  pixKey: string
  courtId: string
}

export default function MinhasPeladas() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('participating')
  // Modal criar jogo — inicializa a partir da URL para evitar flash
  const [isModalOpen, setIsModalOpen] = useState(() => searchParams.get('action') === 'criar')

  // Sorteio
  const [drawEvent, setDrawEvent] = useState<Pelada | null>(null)
  const [teamCount, setTeamCount] = useState(2)
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null)
  const [drawLoading, setDrawLoading] = useState(false)

  // Presença
  const [attendanceEvent, setAttendanceEvent]           = useState<Pelada | null>(null)
  const [attendanceParticipants, setAttendanceParticipants] = useState<Participation[]>([])
  const [attendanceMap, setAttendanceMap]               = useState<Record<string, boolean>>({})
  const [loadingAttendance, setLoadingAttendance]       = useState(false)
  const [savingAttendance, setSavingAttendance]         = useState(false)

  const { register, handleSubmit, reset } = useForm<FormularioPelada>()

  // Limpa o ?action=criar da URL após abrir o modal
  useEffect(() => {
    if (searchParams.get('action') === 'criar') {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  /**
   * A aba "participating" devolve Participation[] (com a pelada aninhada) e a
   * "created" devolve Pelada[]. Cada aba tem a própria entrada de cache, então
   * alternar entre elas ida e volta não refaz a busca.
   */
  const { data: events = [], isPending: loading } = useQuery<Array<Pelada | Participation>>({
    queryKey: activeTab === 'participating' ? chaves.eventos.participando() : chaves.eventos.criados(),
    queryFn: async () => {
      const res = activeTab === 'participating'
        ? await playerService.getMyParticipatingEvents()
        : await playerService.getMyCreatedEvents()
      return res.data || []
    },
  })

  // Só busca quadras quando o modal abre — o `enabled` substitui o useEffect
  // condicional, e o resultado fica em cache para a segunda abertura.
  const { data: courts = [] } = useQuery<Court[]>({
    queryKey: chaves.quadras(),
    queryFn: async () => (await playerService.getCourts()).data || [],
    enabled: isModalOpen,
  })

  /** Invalida as duas abas: criar ou alterar pelada mexe nas duas listas. */
  const invalidarPeladas = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['eventos'] })
  }, [queryClient])

  const onSubmit = async (data: FormularioPelada) => {
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
      invalidarPeladas()
    } catch (error) {
      toast.error(mensagemDeErro(error, 'Erro ao criar pelada'))
    }
  }

  const copyPix = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('Chave PIX copiada!')
  }

  const openDraw = (ev: Pelada) => {
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
      toast.error(mensagemDeErro(error, 'Erro ao realizar sorteio. Verifique se há jogadores suficientes.'))
    } finally {
      setDrawLoading(false)
    }
  }

  const closeDraw = () => {
    setDrawEvent(null)
    setDrawResult(null)
  }

  const openAttendance = async (ev: Pelada) => {
    setAttendanceEvent(ev)
    setLoadingAttendance(true)
    try {
      const res = await playerService.getEventParticipants(ev.courtId, ev.id)
      const participants = res.data ?? []
      setAttendanceParticipants(participants)
      const initial: Record<string, boolean> = {}
      participants.forEach((p: Participation) => {
        const id = p.userId ?? p.user?.id
        if (id) initial[id] = p.attended !== false
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

  const handleUpdateStatus = async (ev: Pelada, status: PeladaStatus) => {
    const label = status === 'FINISHED' ? 'finalizar' : 'cancelar'
    if (!window.confirm(`Tem certeza que deseja ${label} esta pelada?`)) return
    try {
      await playerService.updateEventStatus(ev.courtId, ev.id, status)
      toast.success(`Pelada ${status === 'FINISHED' ? 'finalizada' : 'cancelada'}.`)
      invalidarPeladas()
    } catch (error) {
      toast.error(mensagemDeErro(error, 'Erro ao atualizar status.'))
    }
  }

  return (
    <>
      <Container>
        <PageHeader>
          <div>
            <h1>Meus Jogos</h1>
            <p>Gerencie os jogos que você criou ou está participando.</p>
          </div>
          {/*
            Leva ao assistente, e não ao modal daqui: lá a escolha da quadra é
            estreitada por modalidade e estabelecimento antes de chegar na quadra,
            enquanto o modal despeja o `GET /courts` inteiro num `select` só. Ver #268.
          */}
          <CreateButton onClick={() => navigate('/criar-pelada')}>
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
              const ev = ('pelada' in event && event.pelada ? event.pelada : event) as Pelada
              if (!ev || !ev.id) return null

              const currentPlayers = ev._count?.participations || 0
              const maxPlayers = ev.maxPlayers
              const progress = (currentPlayers / maxPlayers) * 100

              return (
                // O cartão inteiro navega para o detalhe, então todo controle dentro dele
                // precisa de stopPropagation — senão o modal abre e fecha no mesmo clique.
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
                        <button onClick={(e) => { e.stopPropagation(); copyPix(ev.pixKey) }}><Copy size={14} /> Copiar</button>
                      </PixBox>
                      {(ev.status === 'WAITING' || ev.status === 'FULL') && (
                        <>
                          <DrawButton onClick={(e) => { e.stopPropagation(); openDraw(ev) }}>
                            <Shuffle size={14} /> Sortear Times
                          </DrawButton>
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(ev, 'FINISHED') }}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f0fdf4', color: '#166534', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                            >
                              <Flag size={13} /> Finalizar
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(ev, 'CANCELLED') }}
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
                    {courts.map((court: Court) => (
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
                  <DrawResultHeader>
                    <h2>Times Sorteados</h2>
                    <p>
                      {drawResult.totalPlayers} jogadores distribuídos em {drawResult.teamCount} times
                    </p>
                  </DrawResultHeader>

                  {/*
                    Dois times viram confronto, com o ✕ no meio. De três em diante
                    o ✕ não diria nada, e o resultado continua na grade de sempre.
                    O ✕ é irmão dos cartões no grid de três colunas — envolvê-lo
                    junto com eles num `div` quebraria o layout.
                  */}
                  {drawResult.teamCount === 2 ? (
                    <TeamVersus>
                      <CartaoDoTime time={drawResult.teams[0]} indice={0} />
                      <VersusMark aria-hidden="true">✕</VersusMark>
                      <CartaoDoTime time={drawResult.teams[1]} indice={1} />
                    </TeamVersus>
                  ) : (
                    <TeamGrid>
                      {drawResult.teams.map((time, indice) => (
                        <CartaoDoTime key={indice} time={time} indice={indice} />
                      ))}
                    </TeamGrid>
                  )}

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
                    const uid = p.userId ?? p.user?.id ?? ''
                    // `p.name` não existe em Participation — o nome vem sempre
                    // do usuário aninhado; o fallback antigo nunca resolvia.
                    const name = p.user?.name ?? uid
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
    </>
  )
}
