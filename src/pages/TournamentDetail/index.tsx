import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, MapPin, Users, Trophy, Tag, Layers } from 'lucide-react'
import TournamentBracket from '../../components/TournamentBracket'
import DivisionRegistration from '../../components/DivisionRegistration'
import TournamentRegistrations from '../../components/TournamentRegistrations'
import { getTournament, getTournamentDivisions } from '../../services/tournaments'
import { getSportMeta } from '../../hooks/useSports'
import type { Tournament, TournamentDivision } from '../../types/api'
import {
  Container, BackBtn, Header, SportIcon, HeaderInfo,
  TournamentName, PlaceName, StatusBadge,
  Body, InfoGrid, InfoItem, InfoIcon, InfoLabel, InfoValue,
  Divider, FormatCard, FormatIcon, FormatDesc, FormatHint,
  DivisionsSection, SectionTitle,
  BracketSection, LoadingBox,
} from './styles'
import type { BadgeTone } from './styles'

const STATUS_LABEL = {
  DRAFT:               { label: 'Rascunho',              color: 'default' },
  OPEN:                { label: 'Inscrições abertas',     color: 'info'    },
  REGISTRATION_CLOSED: { label: 'Inscrições encerradas',  color: 'warning' },
  IN_PROGRESS:         { label: 'Em andamento',           color: 'warning' },
  FINISHED:            { label: 'Encerrado',              color: 'success' },
  CANCELLED:           { label: 'Cancelado',              color: 'error'   },
}

const FORMAT_META = {
  KNOCKOUT:            { icon: '⚡', label: 'Eliminatório Simples',  desc: 'Times se eliminam a cada rodada — perde, está fora.',             hint: 'Funciona melhor com potência de 2: 4, 8, 16 ou 32 times.' },
  LEAGUE:              { icon: '📊', label: 'Pontos Corridos',        desc: 'Todos jogam entre si e acumulam pontos na tabela.',               hint: 'Mínimo recomendado: 3 times.' },
  GROUPS_AND_KNOCKOUT: { icon: '🎯', label: 'Grupos + Eliminatório',  desc: 'Fase de grupos seguida de eliminatória entre os melhores.',      hint: 'Mínimo recomendado: 4 times.' },
  DOUBLE_ELIMINATION:  { icon: '🔁', label: 'Dupla Eliminação',       desc: 'Cada time precisa perder duas vezes para ser eliminado.',         hint: 'Mínimo recomendado: 4 times.' },
  SWISS:               { icon: '♟️', label: 'Sistema Suíço',          desc: 'Rodadas pareadas por desempenho — ninguém é eliminado até o fim.', hint: 'Flexível, mínimo 4 times.' },
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [tournament, setTournament]   = useState<Tournament | null>(null)
  const [divisions, setDivisions]     = useState<TournamentDivision[]>([])
  const [loading, setLoading]         = useState(true)
  const [showBracket, setShowBracket] = useState(false)
  /* Some sozinho quando a API responde 403 — ver o TournamentRegistrations. */
  const [mostrarInscritos, setMostrarInscritos] = useState(true)

  const load = useCallback(async () => {
    try {
      const [tRes, dRes] = await Promise.all([
        getTournament(id!),
        getTournamentDivisions(id!),
      ])
      // O `?? tRes` era código morto: getTournament devolve o envelope.
      setTournament(tRes.data)
      setDivisions(dRes.data ?? dRes ?? [])
    } catch {
      toast.error('Torneio não encontrado.')
      navigate('/torneios', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  if (loading) return <><LoadingBox>Carregando...</LoadingBox></>
  if (!tournament) return null

  const sport   = getSportMeta(tournament.sportType)
  const fmt     = FORMAT_META[tournament.format]
  const status  = STATUS_LABEL[tournament.status] ?? { label: tournament.status, color: 'default' }

  return (
    <>
      <Container>
        <BackBtn onClick={() => navigate('/torneios')}>
          <ArrowLeft size={16} /> Voltar
        </BackBtn>

        <Header>
          <SportIcon>{sport.icon}</SportIcon>
          <HeaderInfo>
            <TournamentName>{tournament.name}</TournamentName>
            <PlaceName>
              {sport.label}
              {tournament.place?.name ? ` · ${tournament.place.name}` : ''}
              {tournament.place?.city  ? `, ${tournament.place.city}`  : ''}
            </PlaceName>
          </HeaderInfo>
          <StatusBadge $color={status.color as BadgeTone}>{status.label}</StatusBadge>
        </Header>

        <Body>
          {/* Formato com descrição visual */}
          {fmt && (
            <FormatCard>
              <FormatIcon>{fmt.icon}</FormatIcon>
              <div>
                <FormatDesc>{fmt.label} — {fmt.desc}</FormatDesc>
                <FormatHint>{fmt.hint}</FormatHint>
              </div>
            </FormatCard>
          )}

          <InfoGrid>
            <InfoItem>
              <InfoIcon><Calendar size={16} /></InfoIcon>
              <div>
                <InfoLabel>Início</InfoLabel>
                <InfoValue>{fmtDate(tournament.startDate)}</InfoValue>
              </div>
            </InfoItem>

            <InfoItem>
              <InfoIcon><Calendar size={16} /></InfoIcon>
              <div>
                <InfoLabel>Término</InfoLabel>
                <InfoValue>{fmtDate(tournament.endDate)}</InfoValue>
              </div>
            </InfoItem>

            {tournament.place?.name && (
              <InfoItem>
                <InfoIcon><MapPin size={16} /></InfoIcon>
                <div>
                  <InfoLabel>Local</InfoLabel>
                  <InfoValue>{tournament.place.name}{tournament.place.city ? `, ${tournament.place.city}` : ''}</InfoValue>
                </div>
              </InfoItem>
            )}

            {tournament.maxParticipants && (
              <InfoItem>
                <InfoIcon><Users size={16} /></InfoIcon>
                <div>
                  <InfoLabel>Máximo de times</InfoLabel>
                  <InfoValue>{tournament.maxParticipants}</InfoValue>
                </div>
              </InfoItem>
            )}

            {Number(tournament.registrationFee) > 0 && (
              <InfoItem>
                <InfoIcon><Tag size={16} /></InfoIcon>
                <div>
                  <InfoLabel>Taxa de inscrição</InfoLabel>
                  <InfoValue>R$ {Number(tournament.registrationFee).toFixed(2)}</InfoValue>
                </div>
              </InfoItem>
            )}
          </InfoGrid>

          {tournament.description && (
            <>
              <Divider />
              <InfoItem style={{ alignItems: 'flex-start' }}>
                <InfoIcon style={{ marginTop: 2 }}><Trophy size={16} /></InfoIcon>
                <div>
                  <InfoLabel>Descrição</InfoLabel>
                  <InfoValue style={{ whiteSpace: 'pre-wrap' }}>{tournament.description}</InfoValue>
                </div>
              </InfoItem>
            </>
          )}

          {/* Categorias/Divisões */}
          {divisions.length > 0 && (
            <>
              <Divider />
              <DivisionsSection>
                <SectionTitle>
                  <Layers size={15} />
                  {divisions.length} categoria{divisions.length !== 1 ? 's' : ''}
                </SectionTitle>
                {/*
                  * As categorias deixaram de ser etiqueta e viraram lugar onde
                  * se entra (#258). Cada uma diz quantas vagas restam, em que
                  * estado está a inscrição de quem olha, e por que o botão não
                  * está disponível quando não está.
                  */}
                <DivisionRegistration tournament={tournament} divisions={divisions} />
              </DivisionsSection>

              {/*
                * O painel de quem organiza (#259). Ele decide sozinho se
                * aparece: tenta ler os inscritos e se apaga no 403, porque a
                * regra de quem gerencia mora na API e não é reproduzível aqui
                * — o `place` que vem no torneio não traz `ownerId`.
                */}
              {mostrarInscritos && (
                <DivisionsSection>
                  <SectionTitle>
                    <Users size={15} />
                    Inscrições
                  </SectionTitle>
                  <TournamentRegistrations
                    tournament={tournament}
                    divisions={divisions}
                    onIndisponivel={() => setMostrarInscritos(false)}
                  />
                </DivisionsSection>
              )}
            </>
          )}

          {/* Chaveamento */}
          <Divider />
          <BracketSection>
            <SectionTitle
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setShowBracket(v => !v)}
            >
              🏆 Chaveamento {showBracket ? '▲' : '▼'}
            </SectionTitle>
            {showBracket && id && <TournamentBracket tournamentId={id} />}
          </BracketSection>
        </Body>
      </Container>
    </>
  )
}
