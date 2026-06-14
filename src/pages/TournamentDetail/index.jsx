import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, MapPin, Users, Trophy, Tag, Layers } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { MainLayout } from '../../components'
import TournamentBracket from '../../components/TournamentBracket'
import { getTournament, getTournamentDivisions } from '../../services/tournaments'
import { getSportMeta } from '../../hooks/useSports'
import {
  Container, BackBtn, Header, SportIcon, HeaderInfo,
  TournamentName, PlaceName, StatusBadge,
  Body, InfoGrid, InfoItem, InfoIcon, InfoLabel, InfoValue,
  Divider, FormatCard, FormatIcon, FormatDesc, FormatHint,
  DivisionsSection, SectionTitle, DivisionList, DivisionTag,
  BracketSection, LoadingBox,
} from './styles'

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

const LEVEL_LABEL = {
  BEGINNER:     'Iniciante',
  INTERMEDIATE: 'Intermediário',
  AMATEUR:      'Amador',
  ADVANCED:     'Avançado',
  PROFESSIONAL: 'Profissional',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function TournamentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [tournament, setTournament]   = useState(null)
  const [divisions, setDivisions]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [showBracket, setShowBracket] = useState(false)

  const load = useCallback(async () => {
    try {
      const [tRes, dRes] = await Promise.all([
        getTournament(id),
        getTournamentDivisions(id),
      ])
      setTournament(tRes.data ?? tRes)
      setDivisions(dRes.data ?? dRes ?? [])
    } catch {
      toast.error('Torneio não encontrado.')
      navigate('/torneios', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  if (loading) return <MainLayout user={user}><LoadingBox>Carregando...</LoadingBox></MainLayout>
  if (!tournament) return null

  const sport   = getSportMeta(tournament.sportType)
  const fmt     = FORMAT_META[tournament.format]
  const status  = STATUS_LABEL[tournament.status] ?? { label: tournament.status, color: 'default' }

  return (
    <MainLayout user={user}>
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
          <StatusBadge $color={status.color}>{status.label}</StatusBadge>
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

            {tournament.registrationFee > 0 && (
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
                <DivisionList>
                  {divisions.map(div => (
                    <DivisionTag key={div.id}>
                      {div.name}
                      {div.level && div.level !== 'AMATEUR' && (
                        <span> · {LEVEL_LABEL[div.level] ?? div.level}</span>
                      )}
                    </DivisionTag>
                  ))}
                </DivisionList>
              </DivisionsSection>
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
            {showBracket && <TournamentBracket tournamentId={id} />}
          </BracketSection>
        </Body>
      </Container>
    </MainLayout>
  )
}
