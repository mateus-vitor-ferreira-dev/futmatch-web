import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../contexts/AuthContext'
import { useSports } from '../../hooks/useSports'
import { MainLayout } from '../../components'
import { searchCourts } from '../../services/courts'
import { createEvent } from '../../services/events'
import {
  Container, PageHeader, Title, Subtitle,
  StepIndicator, Step, StepDot, StepLine,
  Card, SectionTitle,
  CourtsGrid, CourtCard, CourtName, CourtInfo, SportBadge,
  Form, Row, Field, Label, Input, ErrorMsg, HintMsg,
  Actions, BackButton, NextButton,
  EmptyState, LoadingState,
  SuccessBox, SuccessActions, PrimaryBtn, SecondaryBtn,
  SportChipsGrid, SportChip,
  PlacesGrid, PlaceCard, PlaceName, PlaceAddress, PlaceCourtCount,
  BreadcrumbBar, BreadcrumbTag, BreadcrumbSep,
} from './styles'

const schema = yup.object({
  date: yup
    .string()
    .required('Informe a data e horário'),
  maxPlayers: yup
    .number()
    .typeError('Informe um número válido')
    .min(2, 'Mínimo 2 jogadores')
    .max(50, 'Máximo 50 jogadores')
    .required('Informe o número de vagas'),
  totalValue: yup
    .number()
    .typeError('Informe um valor válido')
    .min(0, 'Valor não pode ser negativo')
    .required('Informe o valor total da pelada'),
  pixKey: yup
    .string()
    .required('Informe a chave Pix para pagamento'),
})

const STEPS = ['Escolher Quadra', 'Detalhes da Pelada', 'Confirmação']

export default function CriarPelada() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const { sports } = useSports()

  const [step, setStep]                 = useState(0)
  const [courts, setCourts]             = useState([])
  const [loadingCourts, setLoadingCourts] = useState(true)
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState(null)

  // Sub-etapas do step 0
  const [filterSport, setFilterSport]   = useState('')   // CourtType enum value
  const [filterPlace, setFilterPlace]   = useState(null) // objeto place

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) })

  useEffect(() => {
    searchCourts()
      .then((res) => setCourts(res.data || []))
      .catch(() => setCourts([]))
      .finally(() => setLoadingCourts(false))
  }, [])

  // Esportes presentes nas quadras disponíveis (evita mostrar chips sem resultado)
  const availableSportIds = useMemo(
    () => new Set(courts.map(c => c.type)),
    [courts]
  )

  const sportOptions = useMemo(
    () => sports.filter(s => availableSportIds.has(s.id)),
    [sports, availableSportIds]
  )

  // Places únicas para o esporte selecionado
  const sportCourts = useMemo(
    () => courts.filter(c => c.type === filterSport),
    [courts, filterSport]
  )

  const availablePlaces = useMemo(() => {
    const map = new Map()
    sportCourts.forEach(c => {
      if (c.place && !map.has(c.place.id)) map.set(c.place.id, c.place)
    })
    return [...map.values()]
  }, [sportCourts])

  // Quadras do esporte + place selecionados
  const placeCourts = useMemo(
    () => sportCourts.filter(c => c.place?.id === filterPlace?.id),
    [sportCourts, filterPlace]
  )

  // Auto-seleciona quadra se só há 1 opção
  const handleSelectPlace = (place) => {
    setFilterPlace(place)
    const courts = sportCourts.filter(c => c.place?.id === place.id)
    if (courts.length === 1) {
      setSelectedCourt(courts[0])
      setStep(1)
    }
  }

  const onSubmit = async (data) => {
    if (!selectedCourt) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        ...data,
        date:       new Date(data.date).toISOString(),
        maxPlayers: Number(data.maxPlayers),
        totalValue: Number(data.totalValue),
      }
      await createEvent(selectedCourt.id, payload)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar pelada. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const watchedValues = watch()
  const pricePerPerson = watchedValues.totalValue && watchedValues.maxPlayers
    ? (Number(watchedValues.totalValue) / Number(watchedValues.maxPlayers)).toFixed(2)
    : null

  const selectedSport = sports.find(s => s.id === filterSport)

  // Título e breadcrumb do step 0
  const step0Title =
    !filterSport ? 'Qual modalidade você quer jogar?' :
    !filterPlace ? 'Escolha o estabelecimento' :
    'Escolha a quadra'

  return (
    <MainLayout user={user}>
      <Container>
        <PageHeader>
          <Title>Criar Pelada</Title>
          <Subtitle>Abra vagas e chame a galera para jogar.</Subtitle>
        </PageHeader>

        <StepIndicator>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: 'contents' }}>
              <Step $active={step === i} $done={step > i}>
                <StepDot $active={step === i} $done={step > i}>
                  {step > i ? '✓' : i + 1}
                </StepDot>
                {label}
              </Step>
              {i < STEPS.length - 1 && <StepLine $done={step > i} />}
            </div>
          ))}
        </StepIndicator>

        {/* ── Etapa 0: Seleção em cascata ── */}
        {step === 0 && (
          <Card>
            <SectionTitle>{step0Title}</SectionTitle>

            {/* Breadcrumb da seleção atual */}
            {filterSport && (
              <BreadcrumbBar>
                <BreadcrumbTag onClick={() => { setFilterSport(''); setFilterPlace(null); setSelectedCourt(null) }}>
                  {selectedSport?.icon} {selectedSport?.label}  ×
                </BreadcrumbTag>
                {filterPlace && (
                  <>
                    <BreadcrumbSep>›</BreadcrumbSep>
                    <BreadcrumbTag onClick={() => { setFilterPlace(null); setSelectedCourt(null) }}>
                      {filterPlace.name}  ×
                    </BreadcrumbTag>
                  </>
                )}
              </BreadcrumbBar>
            )}

            {loadingCourts ? (
              <LoadingState>Carregando quadras disponíveis...</LoadingState>
            ) : (
              <>
                {/* Sub-etapa A: Escolher Modalidade */}
                {!filterSport && (
                  sportOptions.length === 0 ? (
                    <EmptyState>
                      <span>🏟️</span>
                      <p>Nenhuma quadra disponível no momento.</p>
                    </EmptyState>
                  ) : (
                    <SportChipsGrid>
                      {sportOptions.map(s => (
                        <SportChip key={s.id} onClick={() => setFilterSport(s.id)}>
                          <span>{s.icon}</span>
                          {s.label}
                        </SportChip>
                      ))}
                    </SportChipsGrid>
                  )
                )}

                {/* Sub-etapa B: Escolher Estabelecimento */}
                {filterSport && !filterPlace && (
                  availablePlaces.length === 0 ? (
                    <EmptyState>
                      <span>🏟️</span>
                      <p>Nenhum estabelecimento disponível para essa modalidade.</p>
                    </EmptyState>
                  ) : (
                    <PlacesGrid>
                      {availablePlaces.map(place => {
                        const count = sportCourts.filter(c => c.place?.id === place.id).length
                        return (
                          <PlaceCard key={place.id} onClick={() => handleSelectPlace(place)}>
                            <PlaceName>{place.name}</PlaceName>
                            <PlaceAddress>
                              {place.neighborhood && `${place.neighborhood} · `}{place.city}
                            </PlaceAddress>
                            <PlaceCourtCount>
                              {count} quadra{count !== 1 ? 's' : ''} disponível{count !== 1 ? 'is' : ''}
                            </PlaceCourtCount>
                          </PlaceCard>
                        )
                      })}
                    </PlacesGrid>
                  )
                )}

                {/* Sub-etapa C: Escolher Quadra */}
                {filterSport && filterPlace && (
                  <CourtsGrid>
                    {placeCourts.map((court) => (
                      <CourtCard
                        key={court.id}
                        $selected={selectedCourt?.id === court.id}
                        onClick={() => { setSelectedCourt(court); setStep(1) }}
                      >
                        <CourtName>{court.name}</CourtName>
                        <CourtInfo>
                          {court.place?.name && <div>{court.place.name}</div>}
                          {court.place?.neighborhood && court.place?.city && (
                            <div>{court.place.neighborhood} · {court.place.city}</div>
                          )}
                        </CourtInfo>
                        {court.pricePerHour && (
                          <SportBadge>R$ {Number(court.pricePerHour).toFixed(0)}/h</SportBadge>
                        )}
                      </CourtCard>
                    ))}
                  </CourtsGrid>
                )}
              </>
            )}

            <Actions>
              <BackButton type="button" onClick={() => navigate('/quero-jogar')}>
                Cancelar
              </BackButton>
            </Actions>
          </Card>
        )}

        {/* ── Etapa 1: Detalhes da pelada ── */}
        {step === 1 && (
          <Card>
            <SectionTitle>
              Detalhes da pelada em {selectedCourt?.name}
            </SectionTitle>

            <Form onSubmit={handleSubmit(onSubmit)}>
              <Field>
                <Label>Data e horário *</Label>
                <Input
                  type="datetime-local"
                  {...register('date')}
                  $error={!!errors.date}
                />
                {errors.date && <ErrorMsg>{errors.date.message}</ErrorMsg>}
              </Field>

              <Row $cols={2}>
                <Field>
                  <Label>Número de vagas *</Label>
                  <Input
                    type="number"
                    min={2}
                    max={50}
                    placeholder="Ex: 10"
                    {...register('maxPlayers')}
                    $error={!!errors.maxPlayers}
                  />
                  {errors.maxPlayers && <ErrorMsg>{errors.maxPlayers.message}</ErrorMsg>}
                </Field>

                <Field>
                  <Label>Valor total (R$) *</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Ex: 100.00"
                    {...register('totalValue')}
                    $error={!!errors.totalValue}
                  />
                  {errors.totalValue && <ErrorMsg>{errors.totalValue.message}</ErrorMsg>}
                  {pricePerPerson && (
                    <HintMsg>≈ R$ {pricePerPerson} por pessoa</HintMsg>
                  )}
                </Field>
              </Row>

              <Field>
                <Label>Chave Pix *</Label>
                <Input
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  {...register('pixKey')}
                  $error={!!errors.pixKey}
                />
                {errors.pixKey && <ErrorMsg>{errors.pixKey.message}</ErrorMsg>}
                <HintMsg>Os jogadores usarão essa chave para pagar a pelada.</HintMsg>
              </Field>

              {error && (
                <ErrorMsg style={{ padding: '10px', background: '#fff5f5', borderRadius: '6px' }}>
                  ⚠️ {error}
                </ErrorMsg>
              )}

              <Actions>
                <BackButton type="button" onClick={() => setStep(0)}>
                  ← Voltar
                </BackButton>
                <NextButton type="submit" disabled={submitting}>
                  {submitting ? 'Criando...' : 'Criar Pelada ✓'}
                </NextButton>
              </Actions>
            </Form>
          </Card>
        )}

        {/* ── Etapa 2: Sucesso ── */}
        {step === 2 && (
          <Card>
            <SuccessBox>
              <span>🎉</span>
              <h3>Pelada criada com sucesso!</h3>
              <p>
                Sua pelada foi aberta em <strong>{selectedCourt?.name}</strong>.
                Compartilhe com seus amigos para completar as vagas!
              </p>
              <SuccessActions>
                <SecondaryBtn onClick={() => navigate('/minhas-peladas')}>
                  Ver Minhas Peladas
                </SecondaryBtn>
                <PrimaryBtn onClick={() => navigate('/quero-jogar')}>
                  Ver Todas as Peladas
                </PrimaryBtn>
              </SuccessActions>
            </SuccessBox>
          </Card>
        )}

      </Container>
    </MainLayout>
  )
}
