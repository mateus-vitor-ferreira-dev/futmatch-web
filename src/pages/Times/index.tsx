import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Users, MapPin, Crown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSports, getSportMeta } from '../../hooks/useSports'
import { teamsService } from '../../services/teams'
import type { CriarTimeInput } from '../../services/teams'
import { chaves } from '../../lib/queryClient'
import { mensagemDeErro } from '../../utils/apiError'
import { SkeletonCard } from '../../components/Skeleton'
import ConvitesDeTime from '../../components/ConvitesDeTime'
import SportIcon from '../../components/SportIcon'
import type { CourtType, TeamSummary } from '../../types/api'
import {
  Container, PageHeader, CreateButton, Grid, TeamCard, CaptainTag,
  EmptyState, ErrorState, ModalOverlay, ModalContent, Form, ButtonGroup, SecondaryButton,
} from './styles'

const MAX_NOME = 60
const MAX_CIDADE = 80

interface Formulario {
  name: string
  sport: CourtType | ''
  city: string
}

const VAZIO: Formulario = { name: '', sport: '', city: '' }

export default function Times() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { sports } = useSports()

  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState<Formulario>(VAZIO)
  const [erro, setErro] = useState<string | null>(null)
  const primeiroCampo = useRef<HTMLInputElement>(null)

  const { data: times, isPending, isError, error, refetch } = useQuery({
    queryKey: chaves.times.meus(),
    queryFn: teamsService.meusTimes,
  })

  const criar = useMutation({
    mutationFn: (dados: CriarTimeInput) => teamsService.criar(dados),
    onSuccess: (time) => {
      queryClient.invalidateQueries({ queryKey: chaves.times.meus() })
      fecharModal()
      toast.success(`Time ${time.name} criado!`)
    },
    onError: (err: unknown) => setErro(mensagemDeErro(err)),
  })

  // O foco entra no modal ao abrir. Sem isto, quem navega por teclado continua
  // com o cursor no botão que ficou atrás do overlay, e teria de tabular a
  // página inteira para alcançar o primeiro campo.
  useEffect(() => {
    if (modalAberto) primeiroCampo.current?.focus()
  }, [modalAberto])

  function fecharModal() {
    setModalAberto(false)
    setForm(VAZIO)
    setErro(null)
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)

    const name = form.name.trim()
    const city = form.city.trim()

    // Valida antes de chamar: a api recusaria com 422, e a viagem só para
    // descobrir que o campo está vazio é tempo que a pessoa espera à toa.
    if (!name) return setErro('Dê um nome ao time.')
    if (!form.sport) return setErro('Escolha a modalidade principal.')
    if (!city) return setErro('Diga de que cidade o time é.')

    criar.mutate({ name, sport: form.sport, city })
  }

  return (
    <Container>
      <PageHeader>
        <h1>Meus Times</h1>
        <CreateButton type="button" onClick={() => setModalAberto(true)}>
          <Plus size={18} aria-hidden="true" />
          Criar time
        </CreateButton>
      </PageHeader>

      {/*
        Antes da lista: é para cá que a pessoa vem depois da notificação, e um
        convite abaixo dos times já existentes seria um convite que ela rola
        para baixo para achar. Some sozinho quando não há convite.
      */}
      <ConvitesDeTime />

      {isPending && <Grid as="div"><SkeletonCard count={3} /></Grid>}

      {isError && (
        <ErrorState role="alert">
          <p>{mensagemDeErro(error, 'Não deu para carregar seus times.')}</p>
          <SecondaryButton type="button" onClick={() => refetch()} style={{ marginTop: 12 }}>
            Tentar de novo
          </SecondaryButton>
        </ErrorState>
      )}

      {times && times.length === 0 && (
        <EmptyState>
          <h2>Você ainda não tem time</h2>
          <p>
            Time é o grupo que joga junto toda semana. Crie o seu, chame a galera
            e a vaga de vocês para de ser disputada com estranhos.
          </p>
          <CreateButton type="button" onClick={() => setModalAberto(true)}>
            <Plus size={18} aria-hidden="true" />
            Criar meu primeiro time
          </CreateButton>
        </EmptyState>
      )}

      {times && times.length > 0 && (
        <Grid>
          {times.map((time: TeamSummary) => {
            const modalidade = getSportMeta(time.sport)
            const souCapitao = time.captainId === user?.id

            return (
              <TeamCard key={time.id}>
                <Link to={`/times/${time.id}`}>
                  <div className="nome">{time.name}</div>

                  {souCapitao && (
                    <CaptainTag>
                      <Crown size={12} aria-hidden="true" />
                      Você é o capitão
                    </CaptainTag>
                  )}

                  <div className="linha">
                    <span aria-hidden="true"><SportIcon icon={modalidade.icon} fallback={modalidade.iconFallback} /></span>
                    {modalidade.label}
                  </div>
                  <div className="linha">
                    <MapPin size={14} aria-hidden="true" />
                    {time.city}
                  </div>
                  <div className="linha">
                    <Users size={14} aria-hidden="true" />
                    {time._count.members} {time._count.members === 1 ? 'jogador' : 'jogadores'}
                  </div>
                </Link>
              </TeamCard>
            )
          })}
        </Grid>
      )}

      {modalAberto && (
        <ModalOverlay
          onClick={fecharModal}
          onKeyDown={(e) => { if (e.key === 'Escape') fecharModal() }}
        >
          <ModalContent
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-criar-time"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="titulo-criar-time">Criar time</h2>

            <Form onSubmit={enviar} noValidate>
              <label htmlFor="nome-do-time">
                Nome
                <input
                  id="nome-do-time"
                  ref={primeiroCampo}
                  value={form.name}
                  maxLength={MAX_NOME}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Os Boleiros"
                />
              </label>

              <label htmlFor="modalidade-do-time">
                Modalidade principal
                <select
                  id="modalidade-do-time"
                  value={form.sport}
                  onChange={(e) => setForm({ ...form, sport: e.target.value as CourtType })}
                >
                  <option value="">Escolha…</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </label>

              <label htmlFor="cidade-do-time">
                Cidade
                <input
                  id="cidade-do-time"
                  value={form.city}
                  maxLength={MAX_CIDADE}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Campinas"
                />
              </label>

              {erro && <span className="erro" role="alert">{erro}</span>}

              <ButtonGroup>
                <SecondaryButton type="button" onClick={fecharModal}>
                  Cancelar
                </SecondaryButton>
                <CreateButton type="submit" disabled={criar.isPending}>
                  {criar.isPending ? 'Criando…' : 'Criar time'}
                </CreateButton>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  )
}
