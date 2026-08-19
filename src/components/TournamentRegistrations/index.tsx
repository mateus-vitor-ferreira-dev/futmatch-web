import { useCallback, useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import {
  approveRegistration,
  getDivisionRegistrations,
  rejectRegistration,
} from '../../services/tournaments'
import { mensagemDeErro } from '../../utils/apiError'
import type { Tournament, TournamentDivision, TournamentRegistration } from '../../types/api'
import {
  Bloco, Divisao, CabecalhoDaDivisao, NomeDaDivisao, Vagas,
  Linha, Pessoa, NomeDaPessoa, Email, Acoes, Estado,
  Botao, BotaoRecusa, BotaoNeutro,
  CaixaDeRecusa, Justificativa, Nota, Vazio,
} from './styles'
import type { EstadoTom } from './styles'

interface Props {
  tournament: Tournament
  divisions: TournamentDivision[]
  /** Avisa a página quando o painel se descobre indisponível — ver o 403 abaixo. */
  onIndisponivel?: () => void
}

const ESTADO: Record<string, { texto: string; tom: EstadoTom }> = {
  APPROVED: { texto: 'Aprovada', tom: 'ok' },
  PENDING: { texto: 'Aguardando resposta', tom: 'espera' },
  REJECTED: { texto: 'Recusada', tom: 'recusa' },
}

const quando = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

/**
 * As inscrições do campeonato, na visão de quem organiza.
 *
 * **Quem decide se este painel existe é o 403, e não uma regra copiada.** A API
 * protege a listagem com `isTournamentManager`, que aceita ADMIN, dono do
 * espaço ou o organizador do campeonato — e o front não tem como reproduzir
 * isso: o `PlaceSummary` que vem no torneio não traz `ownerId`, então a segunda
 * condição é invisível daqui. Reimplementar as outras duas daria um painel que
 * some para um dono legítimo e aparece vazio para quem não deveria vê-lo.
 *
 * Então o componente **tenta ler** e se apaga quando a resposta é 403. Uma
 * requisição a mais para quem não organiza, e nenhuma regra de autorização
 * duplicada — que é a que sempre diverge primeiro.
 */
export default function TournamentRegistrations({ tournament, divisions, onIndisponivel }: Props) {
  const [porDivisao, setPorDivisao] = useState<Record<string, TournamentRegistration[]>>({})
  const [carregando, setCarregando] = useState(true)
  const [autorizado, setAutorizado] = useState(true)
  const [emAcao, setEmAcao] = useState<string | null>(null)
  const [recusando, setRecusando] = useState<string | null>(null)
  const [justificativa, setJustificativa] = useState('')
  const [erros, setErros] = useState<Record<string, string>>({})

  const carregar = useCallback(async () => {
    setCarregando(true)

    const respostas = await Promise.all(
      divisions.map(async (division) => {
        try {
          const res = await getDivisionRegistrations(tournament.id, division.id)
          return { division, lista: res.data ?? [], negado: false }
        } catch (err) {
          // 403 é a resposta da API a "você não organiza este campeonato", e é
          // o que apaga o painel. Qualquer outro erro é falha de leitura de UMA
          // divisão, e não pode levar as outras junto.
          const negado = err instanceof AxiosError && err.response?.status === 403
          return { division, lista: [] as TournamentRegistration[], negado }
        }
      }),
    )

    if (respostas.some((r) => r.negado)) {
      setAutorizado(false)
      setCarregando(false)
      onIndisponivel?.()
      return
    }

    setPorDivisao(Object.fromEntries(respostas.map((r) => [r.division.id, r.lista])))
    setCarregando(false)
  }, [tournament.id, divisions, onIndisponivel])

  useEffect(() => { carregar() }, [carregar])

  /** Troca a inscrição respondida no lugar dela, sem recarregar a lista inteira. */
  function substituir(divisionId: string, atualizada: TournamentRegistration) {
    setPorDivisao((atual) => ({
      ...atual,
      [divisionId]: (atual[divisionId] ?? []).map((i) => (i.id === atualizada.id ? atualizada : i)),
    }))
  }

  async function aprovar(division: TournamentDivision, registration: TournamentRegistration) {
    setEmAcao(registration.id)
    setErros((e) => ({ ...e, [registration.id]: '' }))

    try {
      const res = await approveRegistration(tournament.id, division.id, registration.id)
      substituir(division.id, res.data)
    } catch (err) {
      // Aprovar PODE falhar por lotação, e é de propósito: a vaga é do
      // aprovado, então a última aprovação de uma divisão cheia é recusada pela
      // API. O organizador precisa ler isso.
      setErros((e) => ({ ...e, [registration.id]: mensagemDeErro(err, 'Não foi possível aprovar.') }))
    } finally {
      setEmAcao(null)
    }
  }

  async function recusar(division: TournamentDivision, registration: TournamentRegistration) {
    setEmAcao(registration.id)
    setErros((e) => ({ ...e, [registration.id]: '' }))

    try {
      const res = await rejectRegistration(tournament.id, division.id, registration.id, justificativa)
      substituir(division.id, res.data)
      setRecusando(null)
      setJustificativa('')
    } catch (err) {
      setErros((e) => ({ ...e, [registration.id]: mensagemDeErro(err, 'Não foi possível recusar.') }))
    } finally {
      setEmAcao(null)
    }
  }

  if (!autorizado) return null
  if (carregando) return <Vazio>Carregando inscrições...</Vazio>

  // Campeonato aberto a todos não tem o que aprovar: a inscrição já nasce
  // `APPROVED`. A lista continua valendo — saber quem entrou é do organizador
  // em qualquer modo —, mas os botões não.
  const exigeResposta = tournament.registrationMode === 'APPROVAL_REQUIRED'

  return (
    <Bloco>
      {divisions.map((division) => {
        const lista = porDivisao[division.id] ?? []
        const aprovadas = lista.filter((i) => i.status === 'APPROVED').length
        const restam =
          division.maxParticipants != null ? division.maxParticipants - aprovadas : null

        return (
          <Divisao key={division.id} data-testid={`inscritos-${division.id}`}>
            <CabecalhoDaDivisao>
              <NomeDaDivisao>{division.name}</NomeDaDivisao>
              <Vagas>
                {/* Conta só aprovadas: pendente é candidato, e a regra de vaga
                    da api#265 é que só a aprovada ocupa. */}
                {restam === null
                  ? `${aprovadas} ${aprovadas === 1 ? 'aprovado' : 'aprovados'}`
                  : `${aprovadas} de ${division.maxParticipants} · ${restam} ${restam === 1 ? 'vaga restante' : 'vagas restantes'}`}
              </Vagas>
            </CabecalhoDaDivisao>

            {lista.length === 0 && <Vazio>Ninguém se inscreveu nesta categoria ainda.</Vazio>}

            {lista.map((registration) => {
              const estado = ESTADO[registration.status]
              const trabalhando = emAcao === registration.id
              const erro = erros[registration.id]
              const pendente = registration.status === 'PENDING'

              return (
                <div key={registration.id}>
                  <Linha>
                    <Pessoa>
                      <NomeDaPessoa>{registration.user?.name ?? 'Inscrito'}</NomeDaPessoa>
                      {registration.user?.email && <Email>{registration.user.email}</Email>}
                    </Pessoa>

                    <Acoes>
                      {estado && <Estado $tom={estado.tom}>{estado.texto}</Estado>}

                      {/* Já respondida não mostra botão: é o que impede o
                          organizador de responder duas vezes a mesma pessoa. */}
                      {exigeResposta && pendente && recusando !== registration.id && (
                        <>
                          <Botao
                            type="button"
                            disabled={trabalhando}
                            onClick={() => aprovar(division, registration)}
                          >
                            {trabalhando ? 'Aprovando...' : 'Aprovar'}
                          </Botao>
                          <BotaoRecusa
                            type="button"
                            disabled={trabalhando}
                            onClick={() => {
                              setRecusando(registration.id)
                              setJustificativa('')
                            }}
                          >
                            Recusar
                          </BotaoRecusa>
                        </>
                      )}
                    </Acoes>
                  </Linha>

                  {recusando === registration.id && (
                    <CaixaDeRecusa>
                      <label htmlFor={`motivo-${registration.id}`}>
                        <Vagas>Por que está recusando? (opcional, e o jogador lê)</Vagas>
                      </label>
                      <Justificativa
                        id={`motivo-${registration.id}`}
                        value={justificativa}
                        maxLength={500}
                        onChange={(e) => setJustificativa(e.target.value)}
                        placeholder="Ex.: categoria destinada a jogadores avançados."
                      />
                      <Acoes>
                        <BotaoRecusa
                          type="button"
                          disabled={trabalhando}
                          onClick={() => recusar(division, registration)}
                        >
                          {trabalhando ? 'Recusando...' : 'Confirmar recusa'}
                        </BotaoRecusa>
                        <BotaoNeutro
                          type="button"
                          disabled={trabalhando}
                          onClick={() => { setRecusando(null); setJustificativa('') }}
                        >
                          Cancelar
                        </BotaoNeutro>
                      </Acoes>
                    </CaixaDeRecusa>
                  )}

                  {/* O que já foi respondido, para o organizador se situar. */}
                  {registration.respondedAt && (
                    <Nota>
                      Respondida em {quando(registration.respondedAt)}
                      {registration.adminNote ? ` · ${registration.adminNote}` : ''}
                    </Nota>
                  )}

                  {/* Erro na tela, e não em toast: quem clicou e viu falhar
                      precisa reler o motivo enquanto decide o que fazer. */}
                  {erro && <Nota $erro role="alert">{erro}</Nota>}
                </div>
              )
            })}
          </Divisao>
        )
      })}
    </Bloco>
  )
}
