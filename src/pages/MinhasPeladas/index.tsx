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
import type { Court, Participation, Pelada, PeladaStatus } from '../../types/api'
import { SorteioDeTimes } from '../../components/SorteioDeTimes'
import { ConfirmacaoDePresencas } from '../../components/ConfirmacaoDePresencas'
import { SortearBtn } from '../../components/SorteioDeTimes/styles'
import {
  Container, PageHeader, CreateButton, Tabs, Tab, PixBox,
  ModalOverlay, ModalContent, Form, ButtonGroup,
} from './styles'

const STATUS_LABELS: Record<string, string> = {
  WAITING:   'Aguardando',
  FULL:      'Lotado',
  FINISHED:  'Finalizado',
  CANCELLED: 'Cancelado',
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

  // Sorteio — a partida aberta no modal. O resto do estado (quantidade,
  // resultado, carregando) vive dentro do SorteioDeTimes.
  const [drawEvent, setDrawEvent] = useState<Pelada | null>(null)

  // Presença
  const [attendanceEvent, setAttendanceEvent]           = useState<Pelada | null>(null)

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
      toast.error(mensagemDeErro(error, 'Erro ao criar partida'))
    }
  }

  const copyPix = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('Chave PIX copiada!')
  }


  const handleUpdateStatus = async (ev: Pelada, status: PeladaStatus) => {
    const label = status === 'FINISHED' ? 'finalizar' : 'cancelar'
    if (!window.confirm(`Tem certeza que deseja ${label} esta partida?`)) return
    try {
      await playerService.updateEventStatus(ev.courtId, ev.id, status)
      toast.success(`Partida ${status === 'FINISHED' ? 'finalizada' : 'cancelada'}.`)
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
                          <SortearBtn onClick={(e) => { e.stopPropagation(); setDrawEvent(ev) }}>
                            <Shuffle size={14} /> Sortear Times
                          </SortearBtn>
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
                          onClick={(e) => { e.stopPropagation(); setAttendanceEvent(ev) }}
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

        {/* Modal Sorteio de Times — o mesmo componente que o detalhe da
            partida usa, para os dois não divergirem (#266). */}
        {drawEvent && (
          <SorteioDeTimes partida={drawEvent} onClose={() => setDrawEvent(null)} />
        )}

        {/* O mesmo componente usado no detalhe da partida (#280). */}
        {attendanceEvent && (
          <ConfirmacaoDePresencas
            partida={attendanceEvent}
            onClose={() => setAttendanceEvent(null)}
          />
        )}
      </Container>
    </>
  )
}
