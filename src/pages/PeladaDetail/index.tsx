import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign, Copy, CheckCircle, Crown, Flag, XCircle, ExternalLink, LogOut, Shuffle, Share2, CheckSquare } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { playerService, MAX_MOTIVO_SAIDA } from '../../services/playerService'
import { getSportMeta } from '../../hooks/useSports'
import type { CourtType, EntryVerdict, Pelada, PeladaStatus } from '../../types/api'
import { mensagemDeErro, codigoDeErro } from '../../utils/apiError'
import RequisitosDaPelada from '../../components/RequisitosDaPelada'
import { SorteioDeTimes } from '../../components/SorteioDeTimes'
import CompartilharPelada from '../../components/CompartilharPelada'
import { MarcaDeVisibilidade } from '../../components/MarcaDeVisibilidade'
import { ConfirmacaoDePresencas } from '../../components/ConfirmacaoDePresencas'
import { SortearBtn } from '../../components/SorteioDeTimes/styles'
import {
  Container, BackBtn, Card, CardHeader, SportIcon, HeaderInfo,
  CourtName, PlaceName, StatusBadge,
  Body, InfoGrid, InfoItem, InfoIcon, InfoLabel, InfoValue,
  Divider, MotivoDoPortao, ProgressSection, ProgressLabel, ProgressText, VagasText,
  ProgressBar, ProgressFill,
  PixBox, PixLabel, PixKey, CopyBtn,
  JoinBtn, OrganizerActions, ActionBtn, OrganizerTag,
  ParticipantsSection, SectionTitle,
  ParticipantList, ParticipantItem, Avatar, ParticipantName, ParticipantNickname,
  ParticipantsCount,
  MapLink, LoadingBox,
  LinkInvalidoBox, LinkInvalidoTitulo, LinkInvalidoTexto,
  LeaveBtn, Modal, ModalOverlay, ModalBox, ModalTitle,
  ReasonInput, ReasonCounter, ModalActions, ModalCancelBtn, ModalConfirmBtn,
} from './styles'

const STATUS_LABEL = {
  WAITING:   { label: 'Aguardando', emoji: '🟢' },
  FULL:      { label: 'Lotado',     emoji: '🟡' },
  FINISHED:  { label: 'Finalizado', emoji: '🔵' },
  CANCELLED: { label: 'Cancelado',  emoji: '🔴' },
}

/**
 * Os três jeitos de um link de convite parar de valer (#229).
 *
 * Cada um manda a pessoa para um lugar diferente — pedir um link novo, pedir
 * mais vagas no link, ou procurar o organizador —, e é por isso que a API os
 * distingue em vez de devolver um "link inválido" genérico. A tela repete a
 * distinção pelo mesmo motivo.
 */
type MotivoDoLink = { titulo: string; explicacao: string }

const MOTIVOS_DO_LINK: Record<string, MotivoDoLink> = {
  INVITE_REVOKED: {
    titulo: 'Este convite foi cancelado',
    explicacao: 'Quem organiza a pelada revogou o link. Fale com essa pessoa para receber um novo.',
  },
  INVITE_EXPIRED: {
    titulo: 'Este convite expirou',
    explicacao: 'O link tinha prazo e ele já passou. Peça um link novo a quem organiza a pelada.',
  },
  INVITE_EXHAUSTED: {
    titulo: 'Este convite já foi usado o bastante',
    explicacao: 'O link tinha um limite de entradas e ele acabou. Quem organiza pode gerar outro.',
  },
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
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated, loading: verificandoSessao } = useAuth()

  /**
   * O token do link de convite, quando a pessoa chegou por um (api#225).
   *
   * É o que abre a pelada `BY_LINK` ou `PRIVATE` para quem não chegaria nela de
   * outro jeito. Sem ele a API responde 404 — o mesmo 404 de pelada que não
   * existe, de propósito, para quem chuta um token não descobrir nada.
   */
  const convite = searchParams.get('convite') ?? undefined

  const [event, setEvent]               = useState<Pelada | null>(null)
  const [loading, setLoading]           = useState(true)
  const [joining, setJoining]           = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)
  const [motivoSaida, setMotivoSaida]   = useState('')
  const [saindo, setSaindo]             = useState(false)
  const [sorteando, setSorteando]       = useState(false)
  const [compartilhando, setCompartilhando] = useState(false)
  const [confirmandoPresencas, setConfirmandoPresencas] = useState(false)
  /** O motivo de o link não abrir a pelada, quando é o link que falhou (#229). */
  const [linkInvalido, setLinkInvalido]  = useState<MotivoDoLink | null>(null)
  const [veredito, setVeredito]         = useState<EntryVerdict | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await playerService.getEvent(eventId!, convite)
      setEvent(res.data)
    } catch (err) {
      // Link que EXISTE para esta pelada e não vale mais responde 403 com o
      // motivo. Quem chuta um token qualquer continua tomando o 404 comum — a
      // API é explícita nisso, e é o que impede sondar pelada privada no chute.
      const motivo = MOTIVOS_DO_LINK[codigoDeErro(err) ?? '']
      if (motivo) {
        setLinkInvalido(motivo)
        setLoading(false)
        return
      }

      toast.error('Partida não encontrada.')
      // Continua indo para a busca, inclusive para o visitante: `/quero-jogar`
      // é rota privada, e o `PrivateRoute` o encaminha para o login. Mesmo
      // destino, um salto a mais.
      //
      // **`isAuthenticated` não pode entrar nas dependências daqui.** Ele vira
      // `true` quando a verificação de sessão termina, e isso remontaria o
      // `load` e refaria a busca da pelada — duas requisições em toda abertura
      // de página, e a segunda chegando depois de a tela já ter renderizado.
      navigate('/quero-jogar', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [eventId, convite, navigate])

  useEffect(() => { load() }, [load])

  /**
   * Pergunta ao portão se este jogador pode entrar — sem tentar entrar.
   *
   * Recarrega junto com a pelada: entrar, sair ou a pelada encher mudam a
   * resposta, e um veredito velho na tela é pior que nenhum.
   *
   * Falhar aqui não pode derrubar a página nem bloquear o botão: sem resposta,
   * a tela volta a se comportar como antes desta issue — o clique tenta, e a
   * API decide. Barrar por falta de informação inventaria uma recusa.
   */
  useEffect(() => {
    if (!event || !isAuthenticated) { setVeredito(null); return }

    let cancelado = false
    playerService
      .checkEntry(event.courtId, event.id)
      .then((res) => { if (!cancelado) setVeredito(res.data) })
      .catch(() => { if (!cancelado) setVeredito(null) })

    return () => { cancelado = true }
  }, [event, isAuthenticated])

  if (loading) return <><LoadingBox>Carregando...</LoadingBox></>

  /*
   * O link falhou — e a tela diz qual dos três motivos foi.
   *
   * Vem antes do `!event` porque aqui a pelada não carregou de propósito: não é
   * ausência de dado, é uma recusa com nome. Mandar essa pessoa para a busca
   * com um toast de "não encontrada" trocaria uma instrução por um beco.
   */
  if (linkInvalido) {
    return (
      <Container>
        <BackBtn onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Ir para o início
        </BackBtn>
        <Card>
          <Body>
            <LinkInvalidoBox data-testid="link-invalido">
              <span aria-hidden>🔗</span>
              <LinkInvalidoTitulo>{linkInvalido.titulo}</LinkInvalidoTitulo>
              <LinkInvalidoTexto>{linkInvalido.explicacao}</LinkInvalidoTexto>
            </LinkInvalidoBox>
          </Body>
        </Card>
      </Container>
    )
  }

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
  const requisitos      = event.requirements ?? []
  /**
   * O portão barra quem não atende, e a tela precisa saber ANTES do clique.
   *
   * `veredito` é `null` até a consulta responder, e continua `null` para quem
   * não tem sessão — a rota exige autenticação, porque a resposta é sobre um
   * jogador específico. Nesse caso a lista de requisitos ainda aparece, só sem
   * o "você atende": é o que o `requirements` da própria pelada permite (#332).
   */
  const barradoPeloPortao = veredito !== null && !veredito.allowed && !isJoined && !isOrganizer
  const motivoDoPortao    = veredito?.failures.find((f) => f.code.startsWith('REQUIREMENT_'))?.message ?? null
  // O organizador não sai da própria pelada — para ele a saída é cancelar ou
  // finalizar, que já estão nas ações abaixo. A API também recusa sair de
  // pelada finalizada ou cancelada, e a tela não oferece o que ela recusaria.
  const canLeave        = isJoined && !isOrganizer && (event.status === 'WAITING' || event.status === 'FULL')
  const canChangeStatus = isOrganizer && (event.status === 'WAITING' || event.status === 'FULL')
  const showPix         = (isJoined || isOrganizer) && event.pixKey

  /**
   * Para onde o cadastro devolve a pessoa (#302).
   *
   * Leva a busca junto, porque é nela que mora o `?convite=`: sem ele, quem
   * chegou por link de pelada `PRIVATE` voltaria do cadastro para um 404.
   *
   * É o critério que a #229 nomeou antes de saber a causa — *"a pessoa clica no
   * convite, é obrigada a se cadastrar, e o cadastro a joga na home"*.
   */
  const voltarPraCa = `${location.pathname}${location.search}`

  /**
   * A lista de participantes é só para quem tem sessão.
   *
   * O visitante vê a contagem, que é o que ajuda a decidir se quer entrar —
   * nome, apelido e avatar de doze desconhecidos não ajudam, e um link de
   * convite é encaminhável para qualquer lugar. Decisão registrada na #302, e
   * escolhida por ser a reversível: abrir depois é fácil, fechar depois já
   * vazou.
   */
  const mostraParticipantes = isAuthenticated && participations.length > 0

  /**
   * O visitante, **depois** de a sessão ter sido verificada.
   *
   * Sem esperar o `loading`, quem tem sessão veria por um instante a tela do
   * visitante — o botão "Entre para participar" e a contagem no lugar da lista
   * — para tudo trocar meio segundo depois. É o mesmo motivo de o
   * `PrivateRoute` devolver `null` enquanto verifica.
   */
  const visitante = !verificandoSessao && !isAuthenticated
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
            <MarcaDeVisibilidade visibility={event.visibility} />
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

            {/*
              * As regras de entrada, antes de qualquer clique (#230).
              *
              * Aparecem para quem quer que veja a pelada — inclusive deslogado,
              * porque vêm no corpo dela (api#332). O "você atende" só aparece
              * com sessão, que é o que a consulta ao portão exige.
              *
              * Pelada sem requisito não renderiza nada: o caso comum não ganha
              * enfeite por causa do raro.
              */}
            {requisitos.length > 0 && (
              <>
                <RequisitosDaPelada requirements={requisitos} veredito={veredito} />
                <Divider />
              </>
            )}

            {/*
              * Sem sessão, o botão não tenta entrar — ele diz o que falta.
              *
              * Entrar continua exigindo login, e deixar o clique falhar contra
              * o 401 seria esconder isso atrás de um erro. O caminho leva o
              * endereço desta pelada junto, com o `?convite=` dentro.
              */}
            {visitante && event.status !== 'FINISHED' && event.status !== 'CANCELLED' && (
              /* Link, e não botão com `onClick`: é navegação, e um link de
                 verdade ganha o menu do botão direito, o abrir em nova aba e o
                 papel certo no leitor de tela — de graça. */
              <JoinBtn
                as={Link}
                to={`/login?next=${encodeURIComponent(voltarPraCa)}`}
                $joined={false}
                $full={isFull}
                $bloqueado={false}
              >
                <Users size={18} /> Entre para participar
              </JoinBtn>
            )}

            {/* Botão de entrar */}
            {isAuthenticated && event.status !== 'FINISHED' && event.status !== 'CANCELLED' && !isOrganizer && (
              <JoinBtn
                $joined={isJoined}
                $full={isFull && !isJoined}
                $bloqueado={barradoPeloPortao}
                disabled={!canJoin || joining || barradoPeloPortao}
                onClick={handleJoin}
                /* O motivo viaja junto do botão para o leitor de tela lê-lo com
                   ele, e não como um texto solto em outro canto da página. */
                aria-describedby={barradoPeloPortao && motivoDoPortao ? 'motivo-do-portao' : undefined}
              >
                {isJoined ? (
                  <><CheckCircle size={18} /> Você está confirmado</>
                ) : isFull ? (
                  'Jogo lotado'
                ) : joining ? (
                  'Entrando...'
                ) : barradoPeloPortao ? (
                  'Você ainda não atende aos requisitos'
                ) : (
                  <><Users size={18} /> Entrar na partida</>
                )}
              </JoinBtn>
            )}

            {/*
              * Por que o botão está desabilitado — escrito, e não adivinhado.
              *
              * A frase é a da API, e ela diz o exigido E o que a pessoa tem.
              * "Você não pode entrar" sozinho soaria como julgamento; com os
              * dois números, soa como a regra da pelada que é.
              */}
            {barradoPeloPortao && motivoDoPortao && (
              <MotivoDoPortao id="motivo-do-portao">{motivoDoPortao}</MotivoDoPortao>
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
                {/* Chamar gente vem antes de sortear: é a ação de quando a
                    pelada ainda não encheu, e é a razão de o organizador abrir
                    esta tela enquanto faltam jogadores (#229). */}
                <SortearBtn onClick={() => setCompartilhando(true)}>
                  <Share2 size={14} /> Chamar gente
                </SortearBtn>
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

            {isOrganizer && event.status === 'FINISHED' && (
              <SortearBtn onClick={() => setConfirmandoPresencas(true)}>
                <CheckSquare size={14} /> Confirmar Presenças
              </SortearBtn>
            )}

            {/*
              * A contagem, para quem não tem sessão — ver `mostraParticipantes`.
              *
              * Some quando ninguém confirmou ainda: "0 de 20" não é informação
              * que mude a decisão de alguém, e a barra de progresso logo acima
              * já contou a mesma história.
              */}
            {visitante && count > 0 && (
              <ParticipantsSection>
                <SectionTitle>Participantes confirmados</SectionTitle>
                <ParticipantsCount>
                  {count} de {maxPlayers} confirmado{count !== 1 ? 's' : ''}
                </ParticipantsCount>
              </ParticipantsSection>
            )}

            {/* Participantes */}
            {mostraParticipantes && (
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

      {compartilhando && (
        <CompartilharPelada pelada={event} onFechar={() => setCompartilhando(false)} />
      )}

      {confirmandoPresencas && (
        <ConfirmacaoDePresencas
          partida={event}
          onClose={() => setConfirmandoPresencas(false)}
          onSaved={load}
        />
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
