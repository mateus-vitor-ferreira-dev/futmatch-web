import { useState, useEffect, useCallback } from 'react'
import { Plus, MapPin, Calendar, Users, Trophy, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../contexts/AuthContext'
import { MainLayout } from '../../components'
import TournamentBracket from '../../components/TournamentBracket'
import { listTournaments, createTournament } from '../../services/tournaments'
import { searchCourts } from '../../services/courts'
import {
  Container, PageHeader, Title, Subtitle, CreateButton,
  FiltersBar, FilterChip,
  Grid, TournamentCard, CardTop, TournamentName, StatusBadge,
  CardMeta, MetaRow, ViewBracketBtn,
  BracketSection, BracketTitle,
  Modal, ModalBox, ModalHeader, ModalTitle, CloseBtn,
  Form, Field, Label, Input, Select, ErrorMsg,
  ModalActions, CancelButton, SubmitButton,
  EmptyState, LoadingState,
} from './styles'

const STATUS_FILTERS = [
  { label: 'Todos',           value: '' },
  { label: 'Inscrições abertas', value: 'OPEN' },
  { label: 'Em andamento',    value: 'IN_PROGRESS' },
  { label: 'Encerrados',      value: 'FINISHED' },
]

const STATUS_LABELS = {
  DRAFT:               'Rascunho',
  OPEN:                'Inscrições abertas',
  REGISTRATION_CLOSED: 'Inscrições encerradas',
  IN_PROGRESS:         'Em andamento',
  FINISHED:            'Encerrado',
  CANCELLED:           'Cancelado',
}

const SPORT_LABELS = {
  SOCIETY:      '⚽ Society',
  CAMPO:        '🏟️ Campo',
  FUTSAL:       '🥅 Futsal',
  AREIA:        '🏖️ Areia',
  VOLEI:        '🏐 Vôlei',
  VOLEI_AREIA:  '🌊 Vôlei de Praia',
  HANDBALL:     '🤾 Handebol',
  PETECA:       '🏸 Peteca',
  BEACH_TENNIS: '🎾 Beach Tennis',
  BASQUETE:     '🏀 Basquete',
  TENIS:        '🎾 Tênis',
}

const FORMATS = [
  { value: 'KNOCKOUT',              label: 'Eliminatório Simples' },
  { value: 'LEAGUE',                label: 'Pontos Corridos' },
  { value: 'GROUPS_AND_KNOCKOUT',   label: 'Grupos + Eliminatório' },
  { value: 'DOUBLE_ELIMINATION',    label: 'Dupla Eliminação' },
  { value: 'SWISS',                 label: 'Sistema Suíço' },
]

const SPORTS = Object.entries(SPORT_LABELS).map(([value, label]) => ({ value, label }))

const schema = yup.object({
  name:          yup.string().required('Informe o nome do torneio'),
  sportType:     yup.string().required('Selecione a modalidade'),
  format:        yup.string().required('Selecione o formato'),
  placeId:       yup.string().required('Selecione o estabelecimento'),
  startDate:     yup.string().nullable(),
  endDate:       yup.string().nullable(),
  maxParticipants: yup.number().typeError('Número inválido').min(2).nullable(),
  registrationFee: yup.number().typeError('Valor inválido').min(0).nullable(),
  description:   yup.string().nullable(),
})

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function Tournaments() {
  const { user }     = useAuth()
  const canCreate    = user?.role === 'OWNER' || user?.role === 'ADMIN'

  const [tournaments, setTournaments]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected]         = useState(null)
  const [showModal, setShowModal]       = useState(false)
  const [places, setPlaces]             = useState([])
  const [submitting, setSubmitting]     = useState(false)
  const [apiError, setApiError]         = useState(null)

  const {
    register, handleSubmit, reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) })

  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true)
      const res = await listTournaments(statusFilter ? { status: statusFilter } : {})
      setTournaments(res.data || [])
    } catch {
      setTournaments([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchTournaments() }, [fetchTournaments])

  useEffect(() => {
    if (!showModal) return
    searchCourts()
      .then((res) => {
        const uniquePlaces = []
        const seen = new Set()
        ;(res.data || []).forEach((court) => {
          if (court.place && !seen.has(court.place.id)) {
            seen.add(court.place.id)
            uniquePlaces.push(court.place)
          }
        })
        setPlaces(uniquePlaces)
      })
      .catch(() => setPlaces([]))
  }, [showModal])

  const onSubmit = async (data) => {
    setSubmitting(true)
    setApiError(null)
    try {
      const payload = {
        ...data,
        organizerType:    'PLACE',
        participantType:  'TEAM',
        registrationMode: 'OPEN',
        startDate:        data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate:          data.endDate   ? new Date(data.endDate).toISOString()   : null,
        maxParticipants:  data.maxParticipants ? Number(data.maxParticipants) : null,
        registrationFee:  data.registrationFee ? Number(data.registrationFee) : null,
      }
      await createTournament(payload)
      reset()
      setShowModal(false)
      fetchTournaments()
    } catch (err) {
      setApiError(err.response?.data?.message || 'Erro ao criar torneio.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout user={user}>
      <Container>

        {/* ── Cabeçalho ── */}
        <PageHeader>
          <div>
            <Title>Torneios</Title>
            <Subtitle>
              {loading ? 'Carregando...' : `${tournaments.length} torneio${tournaments.length !== 1 ? 's' : ''} encontrado${tournaments.length !== 1 ? 's' : ''}`}
            </Subtitle>
          </div>
          {canCreate && (
            <CreateButton onClick={() => setShowModal(true)}>
              <Plus size={16} />
              Novo Torneio
            </CreateButton>
          )}
        </PageHeader>

        {/* ── Filtros ── */}
        <FiltersBar>
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              $active={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </FilterChip>
          ))}
        </FiltersBar>

        {/* ── Lista de torneios ── */}
        {loading ? (
          <LoadingState>Carregando torneios...</LoadingState>
        ) : tournaments.length === 0 ? (
          <EmptyState>
            <span>🏆</span>
            <p>Nenhum torneio encontrado.</p>
          </EmptyState>
        ) : (
          <Grid>
            {tournaments.map((t) => (
              <TournamentCard key={t.id}>
                <CardTop>
                  <TournamentName>
                    {SPORT_LABELS[t.sportType] ?? t.sportType} {t.name}
                  </TournamentName>
                  <StatusBadge $status={t.status}>
                    {STATUS_LABELS[t.status] ?? t.status}
                  </StatusBadge>
                </CardTop>

                <CardMeta>
                  <MetaRow>
                    <Calendar />
                    {formatDate(t.startDate)} → {formatDate(t.endDate)}
                  </MetaRow>
                  {t.place?.name && (
                    <MetaRow><MapPin />{t.place.name}</MetaRow>
                  )}
                  {t.maxParticipants && (
                    <MetaRow><Users />{t.maxParticipants} times</MetaRow>
                  )}
                  {t.registrationFee > 0 && (
                    <MetaRow>
                      <Trophy size={14} />
                      Taxa: R$ {Number(t.registrationFee).toFixed(2)}
                    </MetaRow>
                  )}
                </CardMeta>

                <ViewBracketBtn onClick={() =>
                  setSelected(selected?.id === t.id ? null : t)
                }>
                  {selected?.id === t.id ? '▲ Fechar Chaveamento' : '🏆 Ver Chaveamento'}
                </ViewBracketBtn>
              </TournamentCard>
            ))}
          </Grid>
        )}

        {/* ── Bracket do torneio selecionado ── */}
        {selected && (
          <BracketSection>
            <BracketTitle>🏆 Chaveamento — {selected.name}</BracketTitle>
            <TournamentBracket tournamentId={selected.id} />
          </BracketSection>
        )}

        {/* ── Modal de criação ── */}
        {showModal && (
          <Modal onClick={() => setShowModal(false)}>
            <ModalBox onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>Novo Torneio</ModalTitle>
                <CloseBtn onClick={() => setShowModal(false)}>
                  <X size={20} />
                </CloseBtn>
              </ModalHeader>

              <Form onSubmit={handleSubmit(onSubmit)}>
                <Field>
                  <Label>Nome do torneio *</Label>
                  <Input
                    {...register('name')}
                    $error={!!errors.name}
                    placeholder="Ex: Copa Só+1 Verão 2025"
                  />
                  {errors.name && <ErrorMsg>{errors.name.message}</ErrorMsg>}
                </Field>

                <Field>
                  <Label>Modalidade *</Label>
                  <Select {...register('sportType')} $error={!!errors.sportType}>
                    <option value="">Selecione...</option>
                    {SPORTS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </Select>
                  {errors.sportType && <ErrorMsg>{errors.sportType.message}</ErrorMsg>}
                </Field>

                <Field>
                  <Label>Formato *</Label>
                  <Select {...register('format')} $error={!!errors.format}>
                    <option value="">Selecione...</option>
                    {FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </Select>
                  {errors.format && <ErrorMsg>{errors.format.message}</ErrorMsg>}
                </Field>

                <Field>
                  <Label>Estabelecimento *</Label>
                  <Select {...register('placeId')} $error={!!errors.placeId}>
                    <option value="">Selecione...</option>
                    {places.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                  {errors.placeId && <ErrorMsg>{errors.placeId.message}</ErrorMsg>}
                </Field>

                <Field>
                  <Label>Data de início</Label>
                  <Input type="date" {...register('startDate')} />
                </Field>

                <Field>
                  <Label>Data de término</Label>
                  <Input type="date" {...register('endDate')} />
                </Field>

                <Field>
                  <Label>Máximo de times</Label>
                  <Input
                    type="number" min={2}
                    placeholder="Ex: 8"
                    {...register('maxParticipants')}
                  />
                </Field>

                <Field>
                  <Label>Taxa de inscrição (R$)</Label>
                  <Input
                    type="number" min={0} step="0.01"
                    placeholder="Ex: 50.00"
                    {...register('registrationFee')}
                  />
                </Field>

                <Field>
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Regras, premiação, etc."
                    {...register('description')}
                  />
                </Field>

                {apiError && (
                  <ErrorMsg style={{ padding: '10px', background: '#fff5f5', borderRadius: '6px' }}>
                    ⚠️ {apiError}
                  </ErrorMsg>
                )}

                <ModalActions>
                  <CancelButton type="button" onClick={() => setShowModal(false)}>
                    Cancelar
                  </CancelButton>
                  <SubmitButton type="submit" disabled={submitting}>
                    {submitting ? 'Criando...' : 'Criar Torneio'}
                  </SubmitButton>
                </ModalActions>
              </Form>
            </ModalBox>
          </Modal>
        )}

      </Container>
    </MainLayout>
  )
}