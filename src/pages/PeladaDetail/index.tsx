import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign, Copy, CheckCircle, Crown, Flag, XCircle, ExternalLink } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { MainLayout } from '../../components'
import { playerService } from '../../services/playerService'
import { getSportMeta } from '../../hooks/useSports'
import type { CourtType, Pelada, PeladaStatus } from '../../types/api'
import { mensagemDeErro } from '../../utils/apiError'
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

  const load = useCallback(async () => {
    try {
      const res = await playerService.getEvent(eventId!)
      setEvent(res.data)
    } catch {
      toast.error('Pelada não encontrada.')
      navigate('/quero-jogar', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [eventId, navigate])

  useEffect(() => { load() }, [load])

  if (loading) return <MainLayout user={user}><LoadingBox>Carregando...</LoadingBox></MainLayout>
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
      toast.success('Você entrou na pelada!')
      load()
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Erro ao entrar na pelada.'))
    } finally {
      setJoining(false)
    }
  }

  async function handleStatus(status: PeladaStatus) {
    const label = status === 'FINISHED' ? 'finalizar' : 'cancelar'
    if (!window.confirm(`Tem certeza que deseja ${label} esta pelada?`)) return
    setUpdatingStatus(true)
    try {
      await playerService.updateEventStatus(event!.courtId, event!.id, status)
      toast.success(`Pelada ${status === 'FINISHED' ? 'finalizada' : 'cancelada'} com sucesso.`)
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
    <MainLayout user={user}>
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
                  <><Users size={18} /> Entrar na pelada</>
                )}
              </JoinBtn>
            )}

            {/* Tag de organizador */}
            {isOrganizer && (
              <OrganizerTag>
                <Crown size={12} /> Você é o organizador desta pelada
              </OrganizerTag>
            )}

            {/* Ações do organizador */}
            {canChangeStatus && (
              <OrganizerActions>
                <ActionBtn
                  disabled={updatingStatus}
                  onClick={() => handleStatus('FINISHED')}
                >
                  <Flag size={14} /> Finalizar pelada
                </ActionBtn>
                <ActionBtn
                  $variant="danger"
                  disabled={updatingStatus}
                  onClick={() => handleStatus('CANCELLED')}
                >
                  <XCircle size={14} /> Cancelar
                </ActionBtn>
              </OrganizerActions>
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
    </MainLayout>
  )
}
