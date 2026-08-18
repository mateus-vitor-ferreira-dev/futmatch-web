import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign, Copy, CheckCircle, Crown, Flag, XCircle, ExternalLink, LogOut, Shuffle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { playerService, MAX_MOTIVO_SAIDA } from '../../services/playerService'
import { getSportMeta } from '../../hooks/useSports'
import type { CourtType, Pelada, PeladaStatus } from '../../types/api'
import { mensagemDeErro } from '../../utils/apiError'
import { SorteioDeTimes } from '../../components/SorteioDeTimes'
import { SortearBtn } from '../../components/SorteioDeTimes/styles'
import {
  Container, BackBtn, Card, CardHeader, SportIcon, HeaderInfo,
  CourtName, PlaceName, StatusBadge,
  Body, InfoGrid, InfoItem, InfoIcon, InfoLabel, InfoValue,
  Divider, ProgressSection, ProgressLabel, ProgressText, VagasText,
  ProgressBar, ProgressFill,
  PixBox, PixLabel, PixKey, CopyBtn,
  JoinBtn, OrganizerActions, ActionBtn, OrganizerTag,
  ParticipantsSection, SectionTitle,
  ParticipantList, ParticipantItem, Avatar, ParticipantName, ParticipantNickname,
  MapLink, LoadingBox,
  LeaveBtn, Modal, ModalOverlay, ModalBox, ModalTitle,
  ReasonInput, ReasonCounter, ModalActions, ModalCancelBtn, ModalConfirmBtn,
} from './styles'

const STATUS_LABEL = {
  WAITING:   { label: 'Aguardando', emoji: '🟢' },
  FULL:      { label: 'Lotado',     emoji: '🟡' },
  FINISHED:  { label: 'Finalizado', emoji: '🔵' },
  CANCELLED: { label: 'Cancelado',  emoji: '🔴' },
}

function buildMapsUrl(event: Pelada): string | null {
  const parts = [
    event.court?.place?.name,
    event.court?.place?.neighborhood,
    event.court?.place?.city,
    'Brasil',
  ].filter(Boolean)
  if (!parts.length) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`
}

export default function PeladaDetail() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [event, setEvent]               = useState<Pelada | null>(null)
  const [loading, setLoading]           = useState(true)
  const [joining, setJoining]           = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)
  const [motivoSaida, setMotivoSaida]   = useState('')
  const [saindo, setSaindo]             = useState(false)
  const [sorteando, setSorteando]       = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await playerService.getEvent(eventId!)
      setEvent(res.data)
    } catch {
      toast.error('Partida não encontrada.')
      navigate('/quero-jogar', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [eventId, navigate])

  useEffect(() => { load() }, [load])

  if (loading) return <><LoadingBox>Carregando...</LoadingBox></>
  if (!event)  return null

  const participations  = event.participations ?? []
  const count           = event._count?.participations ?? participations.length
  const maxPlayers      = event.maxPlayers ?? 0
  const pct             = maxPlayers > 0 ? Math.round((count / maxPlayers) * 100) : 0
  const vagas           = maxPlayers - count
  const isFull          = count >= maxPlayers
  const isJoined        = participations.some(p => p.userId === user?.id)
  const isOrganizer     = event.organizer?.id === user?.id
  const canJoin         = !isJoined && !isFull && (event.status === 'WAITING' || event.status === 'FULL')
  // O organizador não sai da própria pelada — para ele a saída é cancelar ou
  // finalizar, que já estão nas ações abaixo. A API também recusa sair de
  // pelada finalizada ou cancelada, e a tela não oferece o que ela recusaria.
  const canLeave        = isJoined && !isOrganizer && (event.status === 'WAITING' || event.status === 'FULL')
  const canChangeStatus = isOrganizer && (event.status === 'WAITING' || event.status === 'FULL')
  const showPix         = (isJoined || isOrganizer) && event.pixKey
  const sport           = getSportMeta(event.court?.type as CourtType)
  const status          = STATUS_LABEL[event.status] ?? { label: event.status, emoji: '⚪' }
  const mapsUrl         = buildMapsUrl(event)

  const dateObj = new Date(event.date)
  const dateStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const pricePerPerson  = maxPlayers > 0 ? (Number(event.totalValue) / maxPlayers).toFixed(2) : '0.00'

  async function handleJoin() {
    setJoining(true)
    try {
      await playerService.joinEvent(event!.courtId, event!.id)
      toast.success('Você entrou na partida!')
      load()
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Erro ao entrar na partida.'))
    } finally {
      setJoining(false)
    }
  }

  function abreConfirmacaoDeSaida() {
    setMotivoSaida('')
    setConfirmandoSaida(true)
  }

  async function handleLeave() {
    setSaindo(true)
    try {
      // Motivo em branco não vai no corpo: a API o trata como ausente, e
      // mandar string vazia só polui a notificação do organizador.
      await playerService.leaveEvent(event!.courtId, event!.id, motivoSaida.trim() || undefined)
      toast.success('Você saiu da partida. Sua vaga foi liberada.')
      setConfirmandoSaida(false)
      load()
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Erro ao sair da partida.'))
    } finally {
      setSaindo(false)
    }
  }

  async function handleStatus(status: PeladaStatus) {
    const label = status === 'FINISHED' ? 'finalizar' : 'cancelar'
    if (!window.confirm(`Tem certeza que deseja ${label} esta partida?`)) return
    setUpdatingStatus(true)
    try {
      await playerService.updateEventStatus(event!.courtId, event!.id, status)
      toast.success(`Partida ${status === 'FINISHED' ? 'finalizada' : 'cancelada'} com sucesso.`)
      load()
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Erro ao atualizar status.'))
    } finally {
      setUpdatingStatus(false)
    }
  }

  function copyPix() {
    navigator.clipboard.writeText(event!.pixKey)
    toast.success('Chave Pix copiada!')
  }

  return (
    <>
      <Container>
        <BackBtn onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Voltar
        </BackBtn>

        <Card>
          <CardHeader>
            <SportIcon>{sport.icon}</SportIcon>
            <HeaderInfo>
              <CourtName>{event.court?.name || 'Quadra'}</CourtName>
              <PlaceName>{event.court?.place?.name}{event.court?.place?.city ? ` · ${event.court.place.city}` : ''}</PlaceName>
            </HeaderInfo>
            <StatusBadge $status={event.status}>
              {status.emoji} {status.label}
            </StatusBadge>
          </CardHeader>

          <Body>
            {/* Informações principais */}
            <InfoGrid>
              <InfoItem>
                <InfoIcon><Calendar size={16} /></InfoIcon>
                <div>
                  <InfoLabel>Data</InfoLabel>
                  <InfoValue style={{ textTransform: 'capitalize' }}>{dateStr}</InfoValue>
                </div>
              </InfoItem>

              <InfoItem>
                <InfoIcon><Clock size={16} /></InfoIcon>
                <div>
                  <InfoLabel>Horário</InfoLabel>
                  <InfoValue>{timeStr}</InfoValue>
                </div>
              </InfoItem>

              <InfoItem>
                <InfoIcon><Users size={16} /></InfoIcon>
                <div>
                  <InfoLabel>Vagas</InfoLabel>
                  <InfoValue>{count} / {maxPlayers} confirmados</InfoValue>
                </div>
              </InfoItem>

              <InfoItem>
                <InfoIcon><DollarSign size={16} /></InfoIcon>
                <div>
                  <InfoLabel>Valor por pessoa</InfoLabel>
                  <InfoValue>R$ {pricePerPerson}</InfoValue>
                </div>
              </InfoItem>
            </InfoGrid>

            {/* Endereço / Maps */}
            {mapsUrl && (
              <MapLink href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin size={14} />
                {[event.court?.place?.name, event.court?.place?.neighborhood, event.court?.place?.city].filter(Boolean).join(', ')}
                <ExternalLink size={12} />
              </MapLink>
            )}

            <Divider />

            {/* Barra de progresso */}
            <ProgressSection>
              <ProgressLabel>
                <ProgressText>{sport.icon} {sport.label}</ProgressText>
                <VagasText $isFull={isFull}>
                  {isFull ? 'Lotado' : `${vagas} vaga${vagas !== 1 ? 's' : ''}`}
                </VagasText>
              </ProgressLabel>
              <ProgressBar>
                <ProgressFill $pct={pct} $isFull={isFull} />
              </ProgressBar>
            </ProgressSection>

            {/* Pix — visível só para participantes e organizador */}
            {showPix && (
              <PixBox>
                <div>
                  <PixLabel>Chave Pix</PixLabel>
                  <PixKey>{event.pixKey}</PixKey>
                </div>
                <CopyBtn onClick={copyPix}>
                  <Copy size={12} /> Copiar
                </CopyBtn>
              </PixBox>
            )}

            <Divider />

            {/* Botão de entrar */}
            {event.status !== 'FINISHED' && event.status !== 'CANCELLED' && !isOrganizer && (
              <JoinBtn
                $joined={isJoined}
                $full={isFull && !isJoined}
                disabled={!canJoin || joining}
                onClick={handleJoin}
              >
                {isJoined ? (
                  <><CheckCircle size={18} /> Você está confirmado</>
                ) : isFull ? (
                  'Jogo lotado'
                ) : joining ? (
                  'Entrando...'
                ) : (
                  <><Users size={18} /> Entrar na partida</>
                )}
              </JoinBtn>
            )}

            {/* Sair da partida */}
            {canLeave && (
              <LeaveBtn onClick={abreConfirmacaoDeSaida} disabled={saindo}>
                <LogOut size={16} />
                {saindo ? 'Saindo...' : 'Sair da partida'}
              </LeaveBtn>
            )}

            {/* Tag de organizador */}
            {isOrganizer && (
              <OrganizerTag>
                <Crown size={12} /> Você é o organizador desta partida
              </OrganizerTag>
            )}

            {/*
              Ações do organizador.

              "Sortear Times" vem primeiro de propósito: é a ação de antes do
              jogo, e a única reversível das três. Finalizar e cancelar não têm
              volta, e ficavam sozinhas aqui — o organizador que abria o detalhe
              para sortear precisava voltar para a lista (#266).
            */}
            {canChangeStatus && (
              <>
                <SortearBtn onClick={() => setSorteando(true)}>
                  <Shuffle size={14} /> Sortear Times
                </SortearBtn>
                <OrganizerActions>
                  <ActionBtn
                    disabled={updatingStatus}
                    onClick={() => handleStatus('FINISHED')}
                  >
                    <Flag size={14} /> Finalizar partida
                  </ActionBtn>
                  <ActionBtn
                    $variant="danger"
                    disabled={updatingStatus}
                    onClick={() => handleStatus('CANCELLED')}
                  >
                    <XCircle size={14} /> Cancelar
                  </ActionBtn>
                </OrganizerActions>
              </>
            )}

            {/* Participantes */}
            {participations.length > 0 && (
              <ParticipantsSection>
                <SectionTitle>Participantes confirmados</SectionTitle>
                <ParticipantList>
                  {participations.map((p) => {
                    const name = p.user?.name ?? 'Jogador'
                    return (
                      <ParticipantItem key={p.userId}>
                        <Avatar>
                          {p.user?.avatarUrl
                            ? <img src={p.user.avatarUrl} alt={name} />
                            : name[0].toUpperCase()
                          }
                        </Avatar>
                        <span>
                          <ParticipantName>{name}</ParticipantName>
                          {p.user?.nickname && (
                            <ParticipantNickname>· {p.user.nickname}</ParticipantNickname>
                          )}
                        </span>
                      </ParticipantItem>
                    )
                  })}
                </ParticipantList>
              </ParticipantsSection>
            )}
          </Body>
        </Card>
      </Container>

      {/* O mesmo modal que "Meus Jogos" abre — um componente só, para os dois
          não divergirem (#266). */}
      {sorteando && (
        <SorteioDeTimes partida={event} onClose={() => setSorteando(false)} />
      )}

      {/* Confirmação de saída — sair por clique errado libera uma vaga que o
          jogador queria manter, e a pelada pode encher enquanto isso. */}
      {confirmandoSaida && (
        <Modal role="dialog" aria-modal="true" aria-label="Sair da partida">
          <ModalOverlay onClick={() => !saindo && setConfirmandoSaida(false)} />
          <ModalBox>
            <ModalTitle>Sair desta partida?</ModalTitle>
            <p>
              Sua vaga volta para a busca na hora e o organizador é avisado.
              Para voltar depois, você precisa entrar de novo — e pode ser que
              não sobre vaga.
            </p>

            <label htmlFor="motivo-saida">
              <p>Quer dizer o motivo? (opcional)</p>
            </label>
            <ReasonInput
              id="motivo-saida"
              rows={3}
              maxLength={MAX_MOTIVO_SAIDA}
              value={motivoSaida}
              onChange={e => setMotivoSaida(e.target.value)}
              placeholder="Ex: me machuquei no treino"
            />
            <ReasonCounter>
              {motivoSaida.length} / {MAX_MOTIVO_SAIDA}
            </ReasonCounter>

            <ModalActions>
              <ModalCancelBtn
                type="button"
                onClick={() => setConfirmandoSaida(false)}
                disabled={saindo}
              >
                Continuar na partida
              </ModalCancelBtn>
              <ModalConfirmBtn type="button" onClick={handleLeave} disabled={saindo}>
                {saindo ? 'Saindo...' : 'Confirmar saída'}
              </ModalConfirmBtn>
            </ModalActions>
          </ModalBox>
        </Modal>
      )}
    </>
  )
}
