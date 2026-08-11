import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useSports } from '../../hooks/useSports'
import { searchCourts } from '../../services/courts'
import { createEvent } from '../../services/events'
import type { Court, Place } from '../../types/api'
import { mensagemDeErro } from '../../utils/apiError'
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

/**
 * Campo numérico vazio chega como `''` e a conversão do yup vira `NaN` — que
 * não é nulo, então o `typeError` respondia antes do `.required()` e o usuário
 * lia "Informe um número válido" onde o time tinha escrito "Informe o número de
 * vagas".
 *
 * Transformando em `undefined`, quem responde é o `.required()`. Some junto a
 * necessidade do `typeError`: com `type="number"`, o navegador já entrega `''`
 * para qualquer coisa que não seja número, então não existe caminho pela
 * interface que produza `NaN` — a mensagem dele seria mais uma que ninguém vê.
 */
const numeroOuIndefinido = (convertido: number, original: unknown) =>
  original === '' || original === null || Number.isNaN(convertido) ? undefined : convertido

const schema = yup.object({
  date: yup
    .string()
    .required('Informe a data e horário')
    .test('future', 'A data deve ser no futuro', v => !v || new Date(v) > new Date()),
  maxPlayers: yup
    .number()
    .transform(numeroOuIndefinido)
    .min(2, 'Mínimo 2 jogadores')
    .max(50, 'Máximo 50 jogadores')
    .required('Informe o número de vagas'),
  totalValue: yup
    .number()
    .transform(numeroOuIndefinido)
    .min(0, 'Valor não pode ser negativo')
    .required('Informe o valor total da pelada'),
  pixKey: yup
    .string()
    .required('Informe a chave Pix para pagamento'),
})

type FormValues = yup.InferType<typeof schema>

const STEPS = ['Escolher Quadra', 'Detalhes da Pelada', 'Confirmação']
const MIN_DATE = new Date(Date.now() + 60000).toISOString().slice(0, 16)

export default function CriarPelada() {
  const navigate   = useNavigate()
  const { sports } = useSports()

  const [step, setStep]                 = useState(0)
  const [courts, setCourts]             = useState<Court[]>([])
  const [loadingCourts, setLoadingCourts] = useState(true)
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState<string | null>(null)

  // Sub-etapas do step 0
  const [filterSport, setFilterSport]   = useState('')   // CourtType enum value
  const [filterPlace, setFilterPlace]   = useState<Place | null>(null) // objeto place

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) })

  useEffect(() => {
    searchCourts()
      .then((res) => setCourts(res.data || []))
      .catch(() => setCourts([]))
      .finally(() => setLoadingCourts(false))
  }, [])

  const sportOptions = sports

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
  const handleSelectPlace = (place: Place) => {
    setFilterPlace(place)
    const courts = sportCourts.filter(c => c.place?.id === place.id)
    if (courts.length === 1) {
      setSelectedCourt(courts[0])
      setStep(1)
    }
  }

  const onSubmit = async (data: FormValues) => {
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
      setError(mensagemDeErro(err, 'Erro ao criar pelada. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  const watchedTotalValue = useWatch({ control, name: 'totalValue' })
  const watchedMaxPlayers = useWatch({ control, name: 'maxPlayers' })
  const pricePerPerson = watchedTotalValue && watchedMaxPlayers
    ? (Number(watchedTotalValue) / Number(watchedMaxPlayers)).toFixed(2)
    : null

  const selectedSport = sports.find(s => s.id === filterSport)

  // Título e breadcrumb do step 0
  const step0Title =
    !filterSport ? 'Qual modalidade você quer jogar?' :
    !filterPlace ? 'Escolha o estabelecimento' :
    'Escolha a quadra'

  return (
    <>
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
                      {availablePlaces.map((place: Place) => {
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
                    {placeCourts.map((court: Court) => (
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

            {/*
              noValidate como no Register, no ForgotPassword, no ResetPassword e
              no OwnerAccess: sem ele o navegador barra o envio pelos min/max dos
              inputs, o handleSubmit nunca roda e as mensagens escritas aqui do
              lado nunca aparecem — o usuário lê o balão nativo, no idioma do
              navegador e fora do estilo do app.

              Os min/max continuam nos inputs: sem bloquear o envio, eles ainda
              limitam as setas e o seletor de data, que é affordance boa.
            */}
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Field>
                <Label>Data e horário *</Label>
                <Input
                  type="datetime-local"
                  min={MIN_DATE}
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
    </>
  )
}
