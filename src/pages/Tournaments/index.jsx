import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, MapPin, Calendar, Users, Trophy, X, Layers } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { useSports } from '../../hooks/useSports'
import { MainLayout } from '../../components'
import TournamentBracket from '../../components/TournamentBracket'
import { listTournaments, createTournament, createDivision } from '../../services/tournaments'
import { list as listPlaces } from '../../services/places'
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
  FormatHint,
  CategorySection, CatChipsRow, PresetChip, CatTag, CatTagRemove, CatInput,
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

const FORMATS = [
  { value: 'KNOCKOUT',            label: 'Eliminatório Simples' },
  { value: 'LEAGUE',              label: 'Pontos Corridos' },
  { value: 'GROUPS_AND_KNOCKOUT', label: 'Grupos + Eliminatório' },
  { value: 'DOUBLE_ELIMINATION',  label: 'Dupla Eliminação' },
  { value: 'SWISS',               label: 'Sistema Suíço' },
]

const FORMAT_ICONS = {
  KNOCKOUT:            '⚡',
  LEAGUE:              '📊',
  GROUPS_AND_KNOCKOUT: '🎯',
  DOUBLE_ELIMINATION:  '🔁',
  SWISS:               '♟️',
}

const FORMAT_INFO = {
  KNOCKOUT:            { desc: 'Times se eliminam a cada rodada — perde, está fora.', hint: 'Funciona melhor com potência de 2: 4, 8, 16 ou 32 times.' },
  LEAGUE:              { desc: 'Todos jogam entre si e acumulam pontos na tabela.',    hint: 'Mínimo recomendado: 3 times.' },
  GROUPS_AND_KNOCKOUT: { desc: 'Fase de grupos seguida de eliminatória entre os melhores.', hint: 'Mínimo recomendado: 4 times.' },
  DOUBLE_ELIMINATION:  { desc: 'Cada time precisa perder duas vezes para ser eliminado — há chave de perdedores.', hint: 'Mínimo recomendado: 4 times.' },
  SWISS:               { desc: 'Rodadas pareadas por desempenho — ninguém é eliminado até o fim.', hint: 'Flexível, mínimo 4 times.' },
}

const FORMAT_PLACEHOLDER = {
  KNOCKOUT:            'Ex: 8 (potência de 2: 4, 8, 16, 32)',
  LEAGUE:              'Ex: 6 (mínimo 3)',
  GROUPS_AND_KNOCKOUT: 'Ex: 8 (mínimo 4)',
  DOUBLE_ELIMINATION:  'Ex: 8 (mínimo 4)',
  SWISS:               'Ex: 8 (mínimo 4)',
}

const PRESET_CATEGORIES = ['Feminino', 'Masculino', 'Misto', 'Amador', 'Iniciante', 'Open', 'Profissional']

const schema = yup.object({
  name:            yup.string().required('Informe o nome do torneio'),
  sportType:       yup.string().required('Selecione a modalidade'),
  format:          yup.string().required('Selecione o formato'),
  placeId:         yup.string().required('Selecione o estabelecimento'),
  startDate:       yup.string().nullable(),
  endDate:         yup.string().nullable(),
  maxParticipants: yup.number().typeError('Número inválido').min(2).nullable(),
  registrationFee: yup.number().typeError('Valor inválido').min(0).nullable(),
  description:     yup.string().nullable(),
})

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function Tournaments() {
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const { sports } = useSports()
  const canCreate  = user?.role === 'OWNER' || user?.role === 'ADMIN'

  const sportLabels = useMemo(() =>
    Object.fromEntries(sports.map(s => [s.id, `${s.icon} ${s.label}`])),
    [sports]
  )
  const sportOptions = useMemo(() =>
    sports.map(s => ({ value: s.id, label: `${s.icon} ${s.label}` })),
    [sports]
  )

  const [tournaments, setTournaments]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected]         = useState(null)
  const [showModal, setShowModal]       = useState(false)
  const [places, setPlaces]             = useState([])
  const [submitting, setSubmitting]     = useState(false)
  const [apiError, setApiError]         = useState(null)
  const [categories, setCategories]     = useState([])
  const [catInput, setCatInput]         = useState('')

  const {
    register, handleSubmit, reset, control,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) })

  const watchedFormat = useWatch({ control, name: 'format' })

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

  // Carrega estabelecimentos: owner vê só os seus, admin vê todos
  useEffect(() => {
    if (!showModal) return
    listPlaces()
      .then((res) => {
        const all = Array.isArray(res) ? res : (res.data ?? [])
        const filtered = user?.role === 'OWNER'
          ? all.filter(p => p.owner?.id === user.id)
          : all
        setPlaces(filtered)
      })
      .catch(() => setPlaces([]))
  }, [showModal, user])

  function closeModal() {
    setShowModal(false)
    reset()
    setCategories([])
    setCatInput('')
    setApiError(null)
  }

  function addCategory(name) {
    const trimmed = name.trim()
    if (!trimmed || categories.includes(trimmed)) return
    setCategories(prev => [...prev, trimmed])
    setCatInput('')
  }

  function removeCategory(name) {
    setCategories(prev => prev.filter(c => c !== name))
  }

  function handleCatKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCategory(catInput)
    }
  }

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
      const res = await createTournament(payload)
      const tournamentId = res.data?.id ?? res.id

      if (tournamentId && categories.length > 0) {
        await Promise.allSettled(
          categories.map(cat => createDivision(tournamentId, { name: cat }))
        )
      }

      toast.success('Torneio criado com sucesso!')
      closeModal()
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
            {tournaments.map((t) => {
              const fmt = FORMATS.find(f => f.value === t.format)
              const divCount = t._count?.divisions ?? 0
              return (
                <TournamentCard key={t.id} onClick={() => navigate(`/torneios/${t.id}`)}>
                  <CardTop>
                    <TournamentName>
                      {sportLabels[t.sportType] ?? t.sportType} {t.name}
                    </TournamentName>
                    <StatusBadge $status={t.status}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </StatusBadge>
                  </CardTop>

                  <CardMeta>
                    {fmt && (
                      <MetaRow>
                        <span style={{ fontSize: 14 }}>{FORMAT_ICONS[t.format]}</span>
                        {fmt.label}
                      </MetaRow>
                    )}
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
                    {divCount > 0 && (
                      <MetaRow>
                        <Layers size={14} />
                        {divCount} categoria{divCount !== 1 ? 's' : ''}
                      </MetaRow>
                    )}
                    {t.registrationFee > 0 && (
                      <MetaRow>
                        <Trophy size={14} />
                        Taxa: R$ {Number(t.registrationFee).toFixed(2)}
                      </MetaRow>
                    )}
                  </CardMeta>

                  <ViewBracketBtn onClick={(e) => {
                    e.stopPropagation()
                    setSelected(selected?.id === t.id ? null : t)
                  }}>
                    {selected?.id === t.id ? '▲ Fechar Chaveamento' : '🏆 Ver Chaveamento'}
                  </ViewBracketBtn>
                </TournamentCard>
              )
            })}
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
          <Modal onClick={closeModal}>
            <ModalBox onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>Novo Torneio</ModalTitle>
                <CloseBtn onClick={closeModal}>
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
                    {sportOptions.map((s) => (
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
                  {watchedFormat && FORMAT_INFO[watchedFormat] && (
                    <FormatHint>
                      <span>{FORMAT_INFO[watchedFormat].desc}</span>
                      <small>{FORMAT_INFO[watchedFormat].hint}</small>
                    </FormatHint>
                  )}
                </Field>

                <Field>
                  <Label>Estabelecimento *</Label>
                  <Select {...register('placeId')} $error={!!errors.placeId}>
                    <option value="">Selecione...</option>
                    {places.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                  {places.length === 0 && (
                    <ErrorMsg style={{ color: '#f59e0b' }}>
                      {user?.role === 'OWNER'
                        ? 'Nenhum estabelecimento vinculado à sua conta.'
                        : 'Nenhum estabelecimento cadastrado.'}
                    </ErrorMsg>
                  )}
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
                    placeholder={FORMAT_PLACEHOLDER[watchedFormat] ?? 'Ex: 8'}
                    {...register('maxParticipants')}
                  />
                  {errors.maxParticipants && <ErrorMsg>{errors.maxParticipants.message}</ErrorMsg>}
                </Field>

                <Field>
                  <Label>Taxa de inscrição (R$)</Label>
                  <Input
                    type="number" min={0} step="0.01"
                    placeholder="Ex: 50.00"
                    {...register('registrationFee')}
                  />
                </Field>

                {/* Categorias (divisões) */}
                <CategorySection>
                  <Label>Categorias <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span></Label>
                  <CatChipsRow>
                    {PRESET_CATEGORIES.filter(c => !categories.includes(c)).map(c => (
                      <PresetChip key={c} type="button" onClick={() => addCategory(c)}>{c}</PresetChip>
                    ))}
                  </CatChipsRow>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {categories.map(cat => (
                      <CatTag key={cat}>
                        {cat}
                        <CatTagRemove type="button" onClick={() => removeCategory(cat)}>
                          <X size={12} />
                        </CatTagRemove>
                      </CatTag>
                    ))}
                    <CatInput
                      type="text"
                      placeholder="Outra categoria..."
                      value={catInput}
                      onChange={e => setCatInput(e.target.value)}
                      onKeyDown={handleCatKeyDown}
                      onBlur={() => catInput.trim() && addCategory(catInput)}
                    />
                  </div>
                </CategorySection>

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
                  <CancelButton type="button" onClick={closeModal}>
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
