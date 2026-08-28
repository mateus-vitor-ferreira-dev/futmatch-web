import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useSports } from '../../hooks/useSports'
import { searchCourts } from '../../services/courts'
import { createEvent } from '../../services/events'
import { playerService } from '../../services/playerService'
import { teamsService } from '../../services/teams'
import { chaves } from '../../lib/queryClient'
import type { Court, PartidaRequirement, PartidaVisibility, Place } from '../../types/api'
import { mensagemDeErro } from '../../utils/apiError'
import { ConfiguracaoDeAcesso } from '../../components/ConfiguracaoDeAcesso'
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
  /**
   * Duração em minutos (api#445). Opcional aqui como é opcional lá: quem não
   * informa fica com 60, e é a api que aplica esse padrão — repeti-lo no
   * formulário criaria dois lugares para mudá-lo no dia em que ele mudar.
   *
   * Os limites são os da api (15 a 480). Ficam duplicados de propósito: o
   * formulário recusa antes de gastar uma requisição, e a api continua sendo a
   * guarda de verdade para quem não passa por esta tela.
   */
  durationMinutes: yup
    .number()
    .transform(numeroOuIndefinido)
    .min(15, 'Mínimo 15 minutos')
    .max(480, 'Máximo 8 horas')
    .optional(),
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
    .required('Informe o valor total da partida'),
  pixKey: yup
    .string()
    .required('Informe a chave Pix para pagamento'),
})

type FormValues = yup.InferType<typeof schema>

const STEPS = ['Escolher Quadra', 'Detalhes da Partida', 'Confirmação']
const MIN_DATE = new Date(Date.now() + 60000).toISOString().slice(0, 16)

export default function CriarPartida() {
  const navigate   = useNavigate()
  const { sports } = useSports()

  const [step, setStep]                 = useState(0)
  const [courts, setCourts]             = useState<Court[]>([])
  const [loadingCourts, setLoadingCourts] = useState(true)
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState<string | null>(null)

  // Visibilidade e requisitos de entrada (#228). Ficam fora do `react-hook-form`
  // porque não são campos: são duas estruturas que o `ConfiguracaoDeAcesso`
  // edita inteiras.
  const [visibilidade, setVisibilidade] = useState<PartidaVisibility>('PUBLIC')
  const [requisitos, setRequisitos]     = useState<PartidaRequirement[]>([])

  /** Os times do organizador, para o requisito "ser do meu time" (api#224). */
  const { data: meusTimes = [] } = useQuery({
    queryKey: chaves.times.meus(),
    queryFn: () => teamsService.meusTimes(),
  })

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

    // Regra impossível de cumprir é recusada pela API com 422, e ali o erro
    // chegaria depois de a partida já existir. Barrar antes é o que evita a
    // partida criada com metade das regras.
    const seloSemSelo = requisitos.find(
      (r) => r.type === 'BADGE' && (r.params?.badges?.length ?? 0) === 0,
    )
    if (seloSemSelo) {
      setError('Marque ao menos um selo, ou remova a regra de selo.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        ...data,
        date:       new Date(data.date).toISOString(),
        maxPlayers: Number(data.maxPlayers),
        totalValue: Number(data.totalValue),
        visibility: visibilidade,
        // Campo vazio some do payload em vez de virar 60 aqui: quem decide o
        // padrão é a api, e mandar o número explicitamente esconderia dela a
        // diferença entre "escolhi uma hora" e "não escolhi nada".
        ...(data.durationMinutes ? { durationMinutes: Number(data.durationMinutes) } : {}),
      }
      const criada = await createEvent(selectedCourt.id, payload)

      /**
       * Os requisitos vão depois, porque a rota deles é pendurada na partida e
       * a partida precisa existir para ter id.
       *
       * Falhar aqui **não desfaz a criação**, e o passo de confirmação aparece
       * do mesmo jeito: a partida existe, e apagá-la para "limpar" destruiria o
       * que deu certo por causa do que não deu. O aviso diz o que ficou pela
       * metade e onde consertar.
       */
      const partida = criada.data
      if (partida && requisitos.length > 0) {
        try {
          for (const requisito of requisitos) {
            await playerService.upsertRequirement(
              selectedCourt.id,
              partida.id,
              requisito.type,
              requisito.params ?? {},
            )
          }
        } catch (err) {
          // A frase é montada, e não delegada ao `mensagemDeErro`: o motivo da
          // API ("Requisito inválido") é útil e insuficiente — sozinho, ele
          // parece dizer que a criação falhou. O que a pessoa precisa saber
          // primeiro é que a partida existe, e onde terminar a configuração.
          setError(
            `A partida foi criada, mas nem todas as regras foram salvas: ${mensagemDeErro(err, 'erro ao salvar a regra')}. Ajuste em "Regras de acesso", nas suas partidas.`,
          )
        }
      }

      setStep(2)
    } catch (err) {
      setError(mensagemDeErro(err, 'Erro ao criar partida. Tente novamente.'))
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
          <Title>Criar Partida</Title>
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

        {/* ── Etapa 1: Detalhes da partida ── */}
        {step === 1 && (
          <Card>
            <SectionTitle>
              Detalhes da partida em {selectedCourt?.name}
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

              <Field>
                <Label>Duração (minutos)</Label>
                <Input
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  placeholder="60"
                  {...register('durationMinutes')}
                  $error={!!errors.durationMinutes}
                />
                {errors.durationMinutes && <ErrorMsg>{errors.durationMinutes.message}</ErrorMsg>}
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
                <HintMsg>Os jogadores usarão essa chave para pagar a partida.</HintMsg>
              </Field>

              {/* Quem vê e quem entra (#228). O mesmo componente edita a partida
                  já criada, para as duas telas não divergirem sobre o que cada
                  regra significa. */}
              <ConfiguracaoDeAcesso
                visibilidade={visibilidade}
                aoMudarVisibilidade={setVisibilidade}
                requisitos={requisitos}
                aoMudarRequisitos={setRequisitos}
                times={meusTimes}
                desabilitado={submitting}
                // A quadra já foi escolhida no passo anterior, e é dela que sai
                // o centro do raio da estimativa (#388).
                courtId={selectedCourt?.id}
              />

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
                  {submitting ? 'Criando...' : 'Criar Partida ✓'}
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
              <h3>Partida criada com sucesso!</h3>
              <p>
                Sua partida foi aberta em <strong>{selectedCourt?.name}</strong>.
                Compartilhe com seus amigos para completar as vagas!
              </p>

              {/*
                O erro aparece AQUI também, e não só na etapa 1 (#228).
                A criação pode dar certo e a regra não — o requisito é pendurado
                na partida, que precisa existir antes. Nesse caso a tela avança
                para cá, e um aviso que ficasse na etapa anterior seria um aviso
                que ninguém lê: a pessoa sairia achando que a partida está
                fechada quando ela está aberta para qualquer um.
              */}
              {error && (
                <ErrorMsg style={{ padding: '10px', background: '#fff5f5', borderRadius: '6px' }}>
                  ⚠️ {error}
                </ErrorMsg>
              )}

              <SuccessActions>
                <SecondaryBtn onClick={() => navigate('/minhas-partidas')}>
                  Ver Minhas Partidas
                </SecondaryBtn>
                <PrimaryBtn onClick={() => navigate('/quero-jogar')}>
                  Ver Todas as Partidas
                </PrimaryBtn>
              </SuccessActions>
            </SuccessBox>
          </Card>
        )}

      </Container>
    </>
  )
}
