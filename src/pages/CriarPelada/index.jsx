import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../contexts/AuthContext'
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
} from './styles'

const SPORT_LABELS = {
  SOCIETY:     '⚽ Society',
  CAMPO:       '🏟️ Campo',
  FUTSAL:      '🥅 Futsal',
  AREIA:       '🏖️ Areia',
  VOLEI:       '🏐 Vôlei',
  VOLEI_AREIA: '🌊 Vôlei de Praia',
  HANDBALL:    '🤾 Handebol',
  PETECA:      '🏸 Peteca',
  BEACH_TENNIS:'🎾 Beach Tennis',
  BASQUETE:    '🏀 Basquete',
  TENIS:       '🎾 Tênis',
}

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
  const [step, setStep]             = useState(0)
  const [courts, setCourts]         = useState([])
  const [loadingCourts, setLoadingCourts] = useState(true)
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [_createdEvent, setCreatedEvent]  = useState(null)
  const [error, setError]           = useState(null)

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
      const res = await createEvent(selectedCourt.id, payload)
      setCreatedEvent(res.data)
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

  return (
    <MainLayout user={user}>
      <Container>
        <PageHeader>
          <Title>Criar Pelada</Title>
          <Subtitle>Abra vagas e chame a galera para jogar.</Subtitle>
        </PageHeader>

        {/* Indicador de etapas */}
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

        {/* ── Etapa 0: Escolher quadra ── */}
        {step === 0 && (
          <Card>
            <SectionTitle>Selecione a quadra</SectionTitle>

            {loadingCourts ? (
              <LoadingState>Carregando quadras disponíveis...</LoadingState>
            ) : courts.length === 0 ? (
              <EmptyState>
                <span>🏟️</span>
                <p>Nenhuma quadra disponível no momento.</p>
              </EmptyState>
            ) : (
              <CourtsGrid>
                {courts.map((court) => (
                  <CourtCard
                    key={court.id}
                    $selected={selectedCourt?.id === court.id}
                    onClick={() => setSelectedCourt(court)}
                  >
                    <CourtName>{court.name}</CourtName>
                    <CourtInfo>
                      {court.place?.name && <div>{court.place.name}</div>}
                      {court.place?.neighborhood && court.place?.city && (
                        <div>{court.place.neighborhood} · {court.place.city}</div>
                      )}
                    </CourtInfo>
                    {court.type && (
                      <SportBadge>{SPORT_LABELS[court.type] ?? court.type}</SportBadge>
                    )}
                  </CourtCard>
                ))}
              </CourtsGrid>
            )}

            <Actions>
              <BackButton type="button" onClick={() => navigate('/quero-jogar')}>
                Cancelar
              </BackButton>
              <NextButton
                type="button"
                disabled={!selectedCourt}
                onClick={() => setStep(1)}
              >
                Próximo →
              </NextButton>
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