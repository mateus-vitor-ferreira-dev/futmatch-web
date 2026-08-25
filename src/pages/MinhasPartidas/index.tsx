import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSportMeta } from '../../hooks/useSports'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { SkeletonCard } from '../../components/Skeleton'
import { Calendar, Clock, Copy, Plus, Shuffle, Flag, XCircle, CheckSquare, ShieldCheck } from 'lucide-react'
import { playerService } from '../../services/playerService'
import { chaves } from '../../lib/queryClient'
import { Grid, Card, CardHeader, InfoRow, ProgressBarContainer, ProgressBar, SpotsInfo } from '../QueroJogar/styles'
import { mensagemDeErro } from '../../utils/apiError'
import type {
  Court,
  Participation,
  Partida,
  PartidaRequirement,
  PartidaStatus,
  PartidaVisibility,
} from '../../types/api'
import { SorteioDeTimes } from '../../components/SorteioDeTimes'
import { ConfirmacaoDePresencas } from '../../components/ConfirmacaoDePresencas'
import { ConfiguracaoDeAcesso } from '../../components/ConfiguracaoDeAcesso'
import { RegrasDaPartida } from '../../components/RegrasDaPartida'
import { MarcaDeVisibilidade } from '../../components/MarcaDeVisibilidade'
import { teamsService } from '../../services/teams'
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

interface FormularioPartida {
  date: string
  time: string
  maxPlayers: string
  totalValue: string
  pixKey: string
  courtId: string
}

export default function MinhasPartidas() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('participating')
  // Modal criar jogo — inicializa a partir da URL para evitar flash
  const [isModalOpen, setIsModalOpen] = useState(() => searchParams.get('action') === 'criar')

  // Sorteio — a partida aberta no modal. O resto do estado (quantidade,
  // resultado, carregando) vive dentro do SorteioDeTimes.
  const [drawEvent, setDrawEvent] = useState<Partida | null>(null)

  // Presença
  const [attendanceEvent, setAttendanceEvent]           = useState<Partida | null>(null)

  // Regras de acesso da partida já criada (#228)
  const [regrasEvent, setRegrasEvent] = useState<Partida | null>(null)

  /**
   * Visibilidade e requisitos do formulário de criação.
   *
   * Ficam fora do `react-hook-form` porque não são campos: são duas estruturas
   * que o `ConfiguracaoDeAcesso` edita inteiras, e registrar uma lista de
   * requisitos no formulário custaria mais do que o `useState` resolve.
   */
  const [visibilidade, setVisibilidade] = useState<PartidaVisibility>('PUBLIC')
  const [requisitos, setRequisitos] = useState<PartidaRequirement[]>([])

  const { register, handleSubmit, reset } = useForm<FormularioPartida>()

  // Limpa o ?action=criar da URL após abrir o modal
  useEffect(() => {
    if (searchParams.get('action') === 'criar') {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  /**
   * A aba "participating" devolve Participation[] (com a partida aninhada) e a
   * "created" devolve Partida[]. Cada aba tem a própria entrada de cache, então
   * alternar entre elas ida e volta não refaz a busca.
   */
  const { data: events = [], isPending: loading } = useQuery<Array<Partida | Participation>>({
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

  // Os times do organizador, para o requisito "ser do meu time". Só quando o
  // modal abre, pelo mesmo motivo das quadras.
  const { data: meusTimes = [] } = useQuery({
    queryKey: chaves.times.meus(),
    queryFn: () => teamsService.meusTimes(),
    enabled: isModalOpen,
  })

  /** Invalida as duas abas: criar ou alterar partida mexe nas duas listas. */
  const invalidarPartidas = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['eventos'] })
  }, [queryClient])

  const fecharCriacao = () => {
    setIsModalOpen(false)
    reset()
    setVisibilidade('PUBLIC')
    setRequisitos([])
  }

  const onSubmit = async (data: FormularioPartida) => {
    // Regra impossível de cumprir é recusada pela API com 422, e ali o erro
    // chegaria depois de a partida já existir. Barrar antes é o que evita a
    // partida criada com metade das regras.
    const seloSemSelo = requisitos.find((r) => r.type === 'BADGE' && (r.params?.badges?.length ?? 0) === 0)
    if (seloSemSelo) {
      toast.error('Marque ao menos um selo, ou remova a regra de selo.')
      return
    }

    try {
      const payload = {
        date: new Date(`${data.date}T${data.time}:00`).toISOString(),
        maxPlayers: parseInt(data.maxPlayers),
        totalValue: parseFloat(data.totalValue),
        pixKey: data.pixKey,
        visibility: visibilidade,
      }
      const criada = await playerService.createEvent(data.courtId, payload)

      /**
       * Os requisitos vão depois, porque a rota deles é pendurada na partida e
       * a partida precisa existir para ter id.
       *
       * Falhar aqui **não desfaz a criação**: a partida existe, e apagá-la para
       * "limpar" seria destruir o que deu certo por causa do que não deu. O
       * aviso diz exatamente isso, e manda o organizador para a edição — que é
       * onde ele conserta sem recomeçar.
       */
      const partida = criada.data
      if (partida && requisitos.length > 0) {
        try {
          for (const requisito of requisitos) {
            await playerService.upsertRequirement(
              data.courtId,
              partida.id,
              requisito.type,
              requisito.params ?? {},
            )
          }
        } catch (error) {
          // Montada, e não delegada ao `mensagemDeErro`: o motivo da API
          // sozinho parece dizer que a criação falhou, e ela não falhou.
          toast.error(
            `A partida foi criada, mas nem todas as regras foram salvas: ${mensagemDeErro(error, 'erro ao salvar a regra')}. Ajuste em "Regras de acesso".`,
          )
        }
      }

      fecharCriacao()
      setActiveTab('created')
      invalidarPartidas()
    } catch (error) {
      toast.error(mensagemDeErro(error, 'Erro ao criar partida'))
    }
  }

  const copyPix = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('Chave PIX copiada!')
  }


  const handleUpdateStatus = async (ev: Partida, status: PartidaStatus) => {
    const label = status === 'FINISHED' ? 'finalizar' : 'cancelar'
    if (!window.confirm(`Tem certeza que deseja ${label} esta partida?`)) return
    try {
      await playerService.updateEventStatus(ev.courtId, ev.id, status)
      toast.success(`Partida ${status === 'FINISHED' ? 'finalizada' : 'cancelada'}.`)
      invalidarPartidas()
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
          <CreateButton onClick={() => navigate('/criar-partida')}>
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
              const ev = ('match' in event && event.match ? event.match : event) as Partida
              if (!ev || !ev.id) return null

              const currentPlayers = ev._count?.participations || 0
              const maxPlayers = ev.maxPlayers
              const progress = (currentPlayers / maxPlayers) * 100

              return (
                // O cartão inteiro navega para o detalhe, então todo controle dentro dele
                // precisa de stopPropagation — senão o modal abre e fecha no mesmo clique.
                <Card key={ev.id} onClick={() => navigate(`/partida/${ev.id}`)} style={{ cursor: 'pointer' }}>
                  <CardHeader>
                    <div>
                      <h3>{ev.court?.place?.name || 'Local'}</h3>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{ev.court?.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <MarcaDeVisibilidade visibility={ev.visibility} />
                      <span className="badge" style={{ color: '#f59e0b', background: '#fef3c7' }}>
                        {STATUS_LABELS[ev.status] ?? ev.status}
                      </span>
                    </div>
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
                          <SortearBtn onClick={(e) => { e.stopPropagation(); setRegrasEvent(ev) }}>
                            <ShieldCheck size={14} /> Regras de acesso
                          </SortearBtn>
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

                {/* Visibilidade e requisitos, na criação (#228). O mesmo
                    componente edita a partida já criada, para as duas telas não
                    divergirem sobre o que cada regra significa. */}
                <ConfiguracaoDeAcesso
                  visibilidade={visibilidade}
                  aoMudarVisibilidade={setVisibilidade}
                  requisitos={requisitos}
                  aoMudarRequisitos={setRequisitos}
                  times={meusTimes}
                />

                <ButtonGroup>
                  <button type="button" className="cancel" onClick={fecharCriacao}>Cancelar</button>
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

        {/* Regras de acesso da partida já criada (#228). */}
        {regrasEvent && (
          <RegrasDaPartida
            partida={regrasEvent}
            onClose={() => setRegrasEvent(null)}
            onSaved={invalidarPartidas}
          />
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
