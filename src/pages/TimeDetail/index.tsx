import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Crown, MapPin, Users, Calendar, Trash2, Pencil } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSports, getSportMeta } from '../../hooks/useSports'
import { teamsService } from '../../services/teams'
import { chaves } from '../../lib/queryClient'
import { mensagemDeErro, codigoDeErro } from '../../utils/apiError'
import { Skeleton } from '../../components/Skeleton'
import {
  SecondaryButton, CreateButton, ModalOverlay, ModalContent, Form, ButtonGroup,
} from '../Times/styles'
import type { CourtType, PeladaStatus, TeamMember, TeamPelada } from '../../types/api'
import {
  Container, BackLink, Hero, CaptainActions, Section,
  MemberList, MemberCard, CaptainBadge,
  PeladaList, PeladaCard, StatusChip, EmptyState, ErrorState,
} from './styles'

const STATUS: Record<PeladaStatus, { label: string; tom: 'aberta' | 'cheia' | 'fim' | 'cancelada' }> = {
  WAITING:   { label: 'Aberta',     tom: 'aberta' },
  FULL:      { label: 'Lotada',     tom: 'cheia' },
  FINISHED:  { label: 'Finalizada', tom: 'fim' },
  CANCELLED: { label: 'Cancelada',  tom: 'cancelada' },
}

const formatarData = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

const iniciais = (nome: string) => nome.trim().charAt(0).toUpperCase()

export default function TimeDetail() {
  const { teamId = '' } = useParams<{ teamId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const time = useQuery({
    queryKey: chaves.times.porId(teamId),
    queryFn: () => teamsService.porId(teamId),
    enabled: Boolean(teamId),
  })

  const souCapitao = Boolean(user?.id) && time.data?.captainId === user?.id
  const souMembro = Boolean(user?.id) && time.data?.members.some((m) => m.userId === user?.id)

  /**
   * As peladas são rota fechada: só quem é do time enxerga. O `enabled` evita
   * pedir o que a api vai recusar — um 403 no console a cada visita de quem
   * abriu a página pelo link é ruído que esconde erro de verdade.
   */
  const peladas = useQuery({
    queryKey: chaves.times.peladas(teamId),
    queryFn: () => teamsService.peladas(teamId),
    enabled: Boolean(teamId) && souMembro,
  })

  const { sports } = useSports()
  const [edicao, setEdicao] = useState<{ name: string; sport: CourtType | ''; city: string } | null>(null)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)
  const primeiroCampo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (edicao) primeiroCampo.current?.focus()
  }, [edicao])

  const editar = useMutation({
    mutationFn: (dados: { name: string; sport: CourtType; city: string }) =>
      teamsService.editar(teamId, dados),
    onSuccess: (atualizado) => {
      // As duas entradas: a lista mostra nome, cidade e modalidade no cartão.
      queryClient.invalidateQueries({ queryKey: chaves.times.porId(teamId) })
      queryClient.invalidateQueries({ queryKey: chaves.times.meus() })
      setEdicao(null)
      toast.success(`Time ${atualizado.name} atualizado.`)
    },
    onError: (err: unknown) => setErroEdicao(mensagemDeErro(err)),
  })

  const apagar = useMutation({
    mutationFn: () => teamsService.apagar(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chaves.times.meus() })
      toast.success('Time apagado.')
      navigate('/times')
    },
    onError: (err: unknown) => toast.error(mensagemDeErro(err)),
  })

  function abrirEdicao() {
    if (!time.data) return
    setErroEdicao(null)
    setEdicao({ name: time.data.name, sport: time.data.sport, city: time.data.city })
  }

  function salvarEdicao(evento: React.FormEvent) {
    evento.preventDefault()
    if (!edicao) return
    setErroEdicao(null)

    const name = edicao.name.trim()
    const city = edicao.city.trim()

    if (!name) return setErroEdicao('O time precisa de um nome.')
    if (!edicao.sport) return setErroEdicao('Escolha a modalidade principal.')
    if (!city) return setErroEdicao('Diga de que cidade o time é.')

    editar.mutate({ name, sport: edicao.sport, city })
  }

  function confirmarEApagar() {
    // As peladas já jogadas sobrevivem — a api usa SET NULL, não cascata. Dizer
    // isso aqui evita que o medo de perder o histórico trave a decisão.
    const certeza = window.confirm(
      'Apagar o time? Os membros perdem o vínculo, mas as peladas já jogadas continuam no histórico de todo mundo.',
    )
    if (certeza) apagar.mutate()
  }

  if (time.isPending) {
    return (
      <Container>
        <Skeleton height={120} radius={16} />
        <div style={{ marginTop: 24 }}><Skeleton height={200} radius={16} /></div>
      </Container>
    )
  }

  if (time.isError) {
    const naoExiste = codigoDeErro(time.error) === 'TEAM_NOT_FOUND'
    return (
      <Container>
        <BackLink as={Link} to="/times">
          <ArrowLeft size={16} aria-hidden="true" />
          Meus times
        </BackLink>
        <ErrorState role="alert">
          <p>
            {naoExiste
              ? 'Este time não existe mais.'
              : mensagemDeErro(time.error, 'Não deu para carregar o time.')}
          </p>
          {!naoExiste && (
            <SecondaryButton type="button" onClick={() => time.refetch()} style={{ marginTop: 12 }}>
              Tentar de novo
            </SecondaryButton>
          )}
        </ErrorState>
      </Container>
    )
  }

  const dados = time.data
  const modalidade = getSportMeta(dados.sport)

  return (
    <Container>
      <BackLink as={Link} to="/times">
        <ArrowLeft size={16} aria-hidden="true" />
        Meus times
      </BackLink>

      <Hero>
        <h1>{dados.name}</h1>
        <div className="meta">
          <span><span aria-hidden="true">{modalidade.icon}</span> {modalidade.label}</span>
          <span><MapPin size={14} aria-hidden="true" /> {dados.city}</span>
          <span><Crown size={14} aria-hidden="true" /> Capitão: {dados.captain.name}</span>
          <span>
            <Users size={14} aria-hidden="true" />
            {dados.members.length} {dados.members.length === 1 ? 'jogador' : 'jogadores'}
          </span>
        </div>

        {/*
          Só o capitão vê estes botões. Não é enfeite: a api responde 403 a
          quem não é, e mostrar um botão que sempre falha ensina a pessoa a
          desconfiar da tela.
        */}
        {souCapitao && (
          <CaptainActions>
            <SecondaryButton type="button" onClick={abrirEdicao}>
              <Pencil size={16} aria-hidden="true" /> Editar time
            </SecondaryButton>
            <SecondaryButton type="button" onClick={confirmarEApagar} disabled={apagar.isPending}>
              <Trash2 size={16} aria-hidden="true" />
              {apagar.isPending ? 'Apagando…' : 'Apagar time'}
            </SecondaryButton>
          </CaptainActions>
        )}
      </Hero>

      <Section aria-labelledby="titulo-membros">
        <h2 id="titulo-membros">Membros</h2>
        <MemberList>
          {dados.members.map((membro: TeamMember) => (
            <MemberCard key={membro.id}>
              <div className="avatar" aria-hidden="true">
                {membro.user.avatarUrl
                  ? <img src={membro.user.avatarUrl} alt="" />
                  : iniciais(membro.user.name)}
              </div>
              <div>
                <div className="nome">{membro.user.nickname || membro.user.name}</div>
                {membro.userId === dados.captainId ? (
                  <CaptainBadge>
                    <Crown size={11} aria-hidden="true" /> Capitão
                  </CaptainBadge>
                ) : (
                  <span className="papel">Jogador</span>
                )}
              </div>
            </MemberCard>
          ))}
        </MemberList>
      </Section>

      <Section aria-labelledby="titulo-peladas">
        <h2 id="titulo-peladas">Peladas do time</h2>

        {!souMembro && (
          <EmptyState>As peladas deste time são visíveis para quem é do time.</EmptyState>
        )}

        {souMembro && peladas.isPending && <Skeleton height={72} radius={12} />}

        {souMembro && peladas.isError && (
          <ErrorState role="alert">
            {mensagemDeErro(peladas.error, 'Não deu para carregar as peladas do time.')}
          </ErrorState>
        )}

        {souMembro && peladas.data?.length === 0 && (
          <EmptyState>
            Este time ainda não jogou nenhuma pelada.
            {souCapitao && ' Crie uma e a vaga da galera fica garantida.'}
          </EmptyState>
        )}

        {souMembro && peladas.data && peladas.data.length > 0 && (
          <PeladaList>
            {peladas.data.map((pelada: TeamPelada) => {
              const situacao = STATUS[pelada.status]
              return (
                <PeladaCard key={pelada.id}>
                  <Link to={`/pelada/${pelada.id}`}>
                    <div>
                      <div className="quando">
                        <Calendar size={14} aria-hidden="true" /> {formatarData(pelada.date)}
                      </div>
                      <div className="onde">
                        {pelada.court.place.name} — {pelada.court.name}
                      </div>
                    </div>
                    <div>
                      <StatusChip $tom={situacao.tom}>{situacao.label}</StatusChip>
                      <div className="vagas">
                        {pelada._count.participations}/{pelada.maxPlayers} jogadores
                      </div>
                    </div>
                  </Link>
                </PeladaCard>
              )
            })}
          </PeladaList>
        )}
      </Section>

      {edicao && (
        <ModalOverlay
          onClick={() => setEdicao(null)}
          onKeyDown={(e) => { if (e.key === 'Escape') setEdicao(null) }}
        >
          <ModalContent
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-editar-time"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="titulo-editar-time">Editar time</h2>

            <Form onSubmit={salvarEdicao} noValidate>
              <label htmlFor="editar-nome">
                Nome
                <input
                  id="editar-nome"
                  ref={primeiroCampo}
                  value={edicao.name}
                  maxLength={60}
                  onChange={(e) => setEdicao({ ...edicao, name: e.target.value })}
                />
              </label>

              <label htmlFor="editar-modalidade">
                Modalidade principal
                <select
                  id="editar-modalidade"
                  value={edicao.sport}
                  onChange={(e) => setEdicao({ ...edicao, sport: e.target.value as CourtType })}
                >
                  <option value="">Escolha…</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </label>

              <label htmlFor="editar-cidade">
                Cidade
                <input
                  id="editar-cidade"
                  value={edicao.city}
                  maxLength={80}
                  onChange={(e) => setEdicao({ ...edicao, city: e.target.value })}
                />
              </label>

              {erroEdicao && <span className="erro" role="alert">{erroEdicao}</span>}

              <ButtonGroup>
                <SecondaryButton type="button" onClick={() => setEdicao(null)}>
                  Cancelar
                </SecondaryButton>
                <CreateButton type="submit" disabled={editar.isPending}>
                  {editar.isPending ? 'Salvando…' : 'Salvar'}
                </CreateButton>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  )
}
