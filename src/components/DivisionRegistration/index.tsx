import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  cancelRegistration,
  getMyRegistrations,
  registerInDivision,
} from '../../services/tournaments'
import { mensagemDeErro } from '../../utils/apiError'
import type { Tournament, TournamentDivision, TournamentRegistration } from '../../types/api'
import {
  Lista, Card, Identificacao, Nome, Vagas, Acao, Botao, BotaoSecundario, Estado, Motivo, Aviso, LinkBotao,
} from './styles'
import type { EstadoTom } from './styles'

interface Props {
  tournament: Tournament
  divisions: TournamentDivision[]
}

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  AMATEUR: 'Amador',
  ADVANCED: 'Avançado',
  PROFESSIONAL: 'Profissional',
}

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Por que este campeonato não aceita inscrição agora — ou `null` quando aceita.
 *
 * **Cada motivo tem texto próprio, e é essa a exigência da web#258.** Um
 * "não é possível se inscrever" genérico deixa o jogador sem saber se volta
 * amanhã, se procura outro campeonato ou se o problema é dele.
 */
function motivoDoCampeonato(tournament: Tournament): string | null {
  if (tournament.participantType === 'TEAM') {
    return 'Este campeonato é por equipe, e a inscrição por equipe ainda não está disponível no app.'
  }

  if (tournament.status !== 'OPEN') {
    const porStatus: Record<string, string> = {
      DRAFT: 'Este campeonato ainda não foi publicado pelo organizador.',
      REGISTRATION_CLOSED: 'As inscrições deste campeonato já encerraram.',
      IN_PROGRESS: 'Este campeonato já começou.',
      FINISHED: 'Este campeonato já terminou.',
      CANCELLED: 'Este campeonato foi cancelado.',
    }
    return porStatus[tournament.status] ?? 'As inscrições deste campeonato não estão abertas.'
  }

  const agora = Date.now()

  if (tournament.registrationStartDate && agora < new Date(tournament.registrationStartDate).getTime()) {
    return `As inscrições abrem em ${dataCurta(tournament.registrationStartDate)}.`
  }

  if (tournament.registrationEndDate && agora > new Date(tournament.registrationEndDate).getTime()) {
    return `As inscrições encerraram em ${dataCurta(tournament.registrationEndDate)}.`
  }

  return null
}

function textoDeVagas(division: TournamentDivision): string {
  const ocupadas = division._count?.approvedRegistrations ?? 0

  // Sem limite, o número de inscritos ainda informa — mas não vira "x de y",
  // que sugeriria um teto que não existe.
  if (division.maxParticipants == null) {
    return ocupadas === 1 ? '1 inscrito' : `${ocupadas} inscritos`
  }

  return `${ocupadas} de ${division.maxParticipants} vagas`
}

const ESTADO_DA_INSCRICAO: Record<string, { texto: string; tom: EstadoTom }> = {
  APPROVED: { texto: 'Você está inscrito', tom: 'ok' },
  PENDING: { texto: 'Aguardando o organizador', tom: 'espera' },
  REJECTED: { texto: 'Inscrição recusada', tom: 'recusa' },
}

/**
 * As divisões de um campeonato, com o estado da inscrição do jogador em cada
 * uma e o que ele pode fazer a respeito.
 *
 * O componente carrega as **próprias** inscrições (`/registrations/me`), e não
 * a lista de inscritos da divisão — aquela é do organizador, e devolveria 403
 * para o jogador.
 */
export default function DivisionRegistration({ tournament, divisions }: Props) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [inscricoes, setInscricoes] = useState<TournamentRegistration[]>([])
  const [vagasPorDivisao, setVagasPorDivisao] = useState<Record<string, number>>({})
  const [emAcao, setEmAcao] = useState<string | null>(null)
  const [erros, setErros] = useState<Record<string, string>>({})

  const carregar = useCallback(async () => {
    if (!isAuthenticated) {
      setInscricoes([])
      return
    }

    try {
      const res = await getMyRegistrations(tournament.id)
      setInscricoes(res.data ?? [])
    } catch {
      // Falhar aqui não pode esconder a lista de divisões: sem as inscrições, a
      // tela ainda mostra as categorias e as vagas, que é leitura pública.
      setInscricoes([])
    }
  }, [isAuthenticated, tournament.id])

  useEffect(() => { carregar() }, [carregar])

  /*
   * O contador de vagas vem da API a cada carga da página. Quando o jogador se
   * inscreve ou cancela **agora**, o número na tela precisa acompanhar sem F5 —
   * este ajuste local é o que faz "3 de 8" virar "4 de 8" no mesmo clique.
   */
  const ajustarVagas = (divisionId: string, delta: number) =>
    setVagasPorDivisao((atual) => ({ ...atual, [divisionId]: (atual[divisionId] ?? 0) + delta }))

  const ocupadasNaTela = (division: TournamentDivision) =>
    (division._count?.approvedRegistrations ?? 0) + (vagasPorDivisao[division.id] ?? 0)

  const inscricaoNa = (divisionId: string) =>
    inscricoes.find((i) => i.divisionId === divisionId)

  async function inscrever(division: TournamentDivision) {
    setEmAcao(division.id)
    setErros((e) => ({ ...e, [division.id]: '' }))

    try {
      const res = await registerInDivision(tournament.id, division.id)
      const nova = res.data

      setInscricoes((atual) => [...atual.filter((i) => i.divisionId !== division.id), nova])

      // Pendente não ocupa vaga — é candidato. Só a aprovada muda o contador.
      if (nova.status === 'APPROVED') ajustarVagas(division.id, 1)
    } catch (err) {
      setErros((e) => ({ ...e, [division.id]: mensagemDeErro(err) }))
    } finally {
      setEmAcao(null)
    }
  }

  async function cancelar(division: TournamentDivision, registration: TournamentRegistration) {
    setEmAcao(division.id)
    setErros((e) => ({ ...e, [division.id]: '' }))

    try {
      await cancelRegistration(tournament.id, division.id, registration.id)
      setInscricoes((atual) => atual.filter((i) => i.id !== registration.id))
      if (registration.status === 'APPROVED') ajustarVagas(division.id, -1)
    } catch (err) {
      setErros((e) => ({ ...e, [division.id]: mensagemDeErro(err) }))
    } finally {
      setEmAcao(null)
    }
  }

  const bloqueio = motivoDoCampeonato(tournament)

  return (
    <Lista>
      {!isAuthenticated && (
        <Aviso>
          <LinkBotao type="button" onClick={() => navigate('/login')}>
            Entre na sua conta
          </LinkBotao>{' '}
          para se inscrever numa categoria.
        </Aviso>
      )}

      {divisions.map((division) => {
        const inscricao = inscricaoNa(division.id)
        const estado = inscricao ? ESTADO_DA_INSCRICAO[inscricao.status] : null
        const ocupadas = ocupadasNaTela(division)
        // Conta sobre o número que a tela mostra, e não sobre o que a API
        // devolveu: quem acabou de se inscrever precisa ver a vaga sumir.
        const lotada = division.maxParticipants != null && ocupadas >= division.maxParticipants
        const trabalhando = emAcao === division.id
        const erro = erros[division.id]

        // Recusado pode tentar de novo: foi o organizador que disse não, e a
        // decisão pode ter mudado. Pendente e aprovado não — ali a inscrição
        // está viva, e o botão seria um 409 esperando acontecer.
        const podeInscrever = !inscricao || inscricao.status === 'REJECTED'
        const impedimento = bloqueio ?? (lotada ? 'Esta categoria está com as vagas esgotadas.' : null)

        return (
          <Card key={division.id} data-testid={`divisao-${division.id}`}>
            <Identificacao>
              <Nome>
                {division.name}
                {division.level && division.level !== 'AMATEUR' && (
                  <span> · {LEVEL_LABEL[division.level] ?? division.level}</span>
                )}
              </Nome>
              <Vagas>
                {textoDeVagas({ ...division, _count: { approvedRegistrations: ocupadas } })}
              </Vagas>
            </Identificacao>

            <Acao>
              {estado && <Estado $tom={estado.tom}>{estado.texto}</Estado>}

              {isAuthenticated && podeInscrever && (
                <Botao
                  type="button"
                  onClick={() => inscrever(division)}
                  disabled={trabalhando || impedimento !== null}
                >
                  {trabalhando ? 'Enviando...' : inscricao ? 'Tentar de novo' : 'Inscrever-se'}
                </Botao>
              )}

              {isAuthenticated && inscricao && inscricao.status !== 'REJECTED' && (
                <BotaoSecundario
                  type="button"
                  onClick={() => cancelar(division, inscricao)}
                  disabled={trabalhando || tournament.status !== 'OPEN'}
                >
                  {trabalhando ? 'Cancelando...' : 'Cancelar inscrição'}
                </BotaoSecundario>
              )}
            </Acao>

            {/* O motivo da recusa é o que diz ao jogador se adianta insistir. */}
            {inscricao?.status === 'REJECTED' && inscricao.adminNote && (
              <Motivo>Motivo: {inscricao.adminNote}</Motivo>
            )}

            {/* Por que o botão está desabilitado — escrito, e não adivinhado. */}
            {isAuthenticated && podeInscrever && impedimento && !erro && (
              <Motivo>{impedimento}</Motivo>
            )}

            {inscricao && inscricao.status !== 'REJECTED' && tournament.status !== 'OPEN' && !erro && (
              <Motivo>Não dá mais para cancelar: as inscrições deste campeonato já encerraram.</Motivo>
            )}

            {/*
             * O erro da API fica NA TELA, e não num toast que some. Quem clicou
             * e viu falhar precisa poder reler o motivo enquanto decide o que
             * fazer — foi a exigência da web#258.
             */}
            {erro && <Motivo $erro role="alert">{erro}</Motivo>}
          </Card>
        )
      })}
    </Lista>
  )
}
