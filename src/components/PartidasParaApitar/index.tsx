import { useEffect, useState } from 'react'
import { Flag } from 'lucide-react'
import { getRefereeingMatches } from '../../services/tournaments'
import LancarPlacar from '../LancarPlacar'
import type { RefereeingMatch, TournamentMatch } from '../../types/api'
import {
  Bloco, Titulo, Partida, Topo, Onde, Confronto, Contexto, Botao, Resultado,
} from './styles'

const nomeDe = (lado: TournamentMatch['participantA']) => lado?.user.name ?? 'A definir'

const quando = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : null

/**
 * As partidas em que o usuário foi designado árbitro, de todos os campeonatos.
 *
 * **O componente some quando não há nada para apitar**, e é por isso que ele
 * vive dentro da página de Torneios em vez de virar item de menu: a esmagadora
 * maioria das contas nunca vai apitar, e um "Apitar" permanente na navegação
 * seria ruído para elas. Quem apita encontra tudo num lugar só — que é o que a
 * #261 pede quando diz *sem precisar procurar campeonato por campeonato*.
 *
 * A lista atravessa campeonatos, então cada linha diz de qual torneio e de qual
 * divisão a partida é: sem isso o árbitro saberia o placar a lançar e não
 * saberia onde.
 */
export default function PartidasParaApitar() {
  const [partidas, setPartidas] = useState<RefereeingMatch[]>([])
  const [lancando, setLancando] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false

    getRefereeingMatches()
      .then((res) => { if (!cancelado) setPartidas(res.data ?? []) })
      // Falhar aqui não pode derrubar a página de torneios: a seção some, e a
      // listagem de campeonatos — que é o conteúdo principal — continua.
      .catch(() => { if (!cancelado) setPartidas([]) })

    return () => { cancelado = true }
  }, [])

  if (partidas.length === 0) return null

  function aposLancar(atualizada: TournamentMatch) {
    setPartidas((atual) =>
      atual.map((p) => (p.id === atualizada.id ? { ...p, ...atualizada } : p)),
    )
    setLancando(null)
  }

  return (
    <Bloco data-testid="partidas-para-apitar">
      <Titulo>
        <Flag size={16} />
        Suas partidas para apitar
      </Titulo>

      {partidas.map((partida) => {
        const encerrada = partida.status === 'FINISHED' || partida.status === 'WALKOVER'
        const horario = quando(partida.scheduledAt)
        const contexto = [
          partida.division.tournament.name,
          partida.division.name,
          partida.court?.name,
          horario,
        ].filter(Boolean).join(' · ')

        return (
          <Partida key={partida.id} data-testid={`apitar-${partida.id}`}>
            <Topo>
              <Onde>
                <Confronto>
                  {nomeDe(partida.participantA)} × {nomeDe(partida.participantB)}
                </Confronto>
                <Contexto>{contexto}</Contexto>
              </Onde>

              {encerrada ? (
                <Resultado>
                  {partida.status === 'WALKOVER'
                    ? 'W.O. lançado'
                    : `${partida.scoreA} × ${partida.scoreB}`}
                </Resultado>
              ) : (
                lancando !== partida.id && (
                  <Botao type="button" onClick={() => setLancando(partida.id)}>
                    Lançar placar
                  </Botao>
                )
              )}
            </Topo>

            {lancando === partida.id && (
              <LancarPlacar
                tournamentId={partida.division.tournament.id}
                divisionId={partida.divisionId}
                match={partida}
                onLancado={aposLancar}
                onCancelar={() => setLancando(null)}
              />
            )}
          </Partida>
        )
      })}
    </Bloco>
  )
}
