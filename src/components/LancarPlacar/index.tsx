import { useState } from 'react'
import { submitMatchResult } from '../../services/tournaments'
import type { MatchResultInput } from '../../services/tournaments'
import { mensagemDeErro } from '../../utils/apiError'
import type { TournamentMatch } from '../../types/api'
import {
  Caixa, Confronto, LadoDoPlacar, NomeDoLado, CampoDePlacar,
  EscolhaDoWo, Acoes, Botao, BotaoNeutro, Aviso,
  Confirmacao, TextoDaConfirmacao,
} from './styles'

interface Props {
  tournamentId: string
  divisionId: string
  match: TournamentMatch
  /** Recebe a partida já atualizada pela API. */
  onLancado: (atualizada: TournamentMatch) => void
  onCancelar?: () => void
}

const nomeDe = (lado: TournamentMatch['participantA']) => lado?.user.name ?? 'A definir'

/**
 * O placar de uma partida do mata-mata, lançado pelo árbitro ou por quem
 * organiza.
 *
 * **Confirma antes de enviar, e o motivo é concreto:** placar lançado fecha a
 * partida e faz o vencedor subir de rodada. Desfazer só é possível enquanto a
 * partida seguinte não tiver resultado — depois disso, corrigir esta trocaria
 * quem jogou aquela. A regra é da API (`exigeCorrecaoAindaPossivel`), e a
 * confirmação existe para o clique não ser mais barato que a consequência.
 *
 * As duas validações daqui — empate e placar ausente — **repetem** regras que a
 * API já aplica. Isso é deliberado: barrar aqui é cortesia para o árbitro não
 * digitar de novo, e a autoridade continua sendo do servidor. Por isso o erro
 * da API também aparece na tela, em vez de a tela assumir que já filtrou tudo.
 */
export default function LancarPlacar({ tournamentId, divisionId, match, onLancado, onCancelar }: Props) {
  const [placarA, setPlacarA] = useState('')
  const [placarB, setPlacarB] = useState('')
  const [wo, setWo] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const nomeA = nomeDe(match.participantA)
  const nomeB = nomeDe(match.participantB)

  /** O que impede o envio agora — ou `null` quando dá para enviar. */
  function impedimento(): string | null {
    if (wo) return null

    if (placarA.trim() === '' || placarB.trim() === '') {
      return 'Preencha o placar dos dois lados, ou registre um W.O.'
    }

    const a = Number(placarA)
    const b = Number(placarB)

    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
      return 'O placar é um número inteiro, e não pode ser negativo.'
    }

    // Mata-mata não admite empate: alguém precisa subir para a rodada seguinte,
    // e um empate deixaria a vaga sem dono sem nada avisar.
    if (a === b) {
      return 'O mata-mata não admite empate — alguém precisa avançar para a rodada seguinte.'
    }

    return null
  }

  const bloqueio = impedimento()

  /** O que vai acontecer, escrito, para a confirmação não ser um "tem certeza?". */
  function resumo(): string {
    if (wo) {
      const vencedor = wo === match.participantAId ? nomeA : nomeB
      return `${vencedor} vence por W.O.`
    }
    const a = Number(placarA)
    const b = Number(placarB)
    const vencedor = a > b ? nomeA : nomeB
    return `${nomeA} ${a} × ${b} ${nomeB} — ${vencedor} avança.`
  }

  async function enviar() {
    setEnviando(true)
    setErro('')

    const corpo: MatchResultInput = wo
      ? { walkoverWinnerId: wo }
      : { scoreA: Number(placarA), scoreB: Number(placarB) }

    try {
      const res = await submitMatchResult(tournamentId, divisionId, match.id, corpo)
      onLancado(res.data)
    } catch (err) {
      setErro(mensagemDeErro(err, 'Não foi possível lançar o resultado.'))
      setConfirmando(false)
    } finally {
      setEnviando(false)
    }
  }

  // Partida sem os dois lados não recebe resultado — a API responde 422, e o
  // formulário aqui só ofereceria um erro garantido.
  if (!match.participantAId || !match.participantBId) {
    return (
      <Caixa>
        <Aviso>
          Esta partida ainda não tem os dois participantes definidos. O placar só pode
          ser lançado quando as duas vagas estiverem preenchidas.
        </Aviso>
        {onCancelar && (
          <Acoes>
            <BotaoNeutro type="button" onClick={onCancelar}>Fechar</BotaoNeutro>
          </Acoes>
        )}
      </Caixa>
    )
  }

  if (confirmando) {
    return (
      <Caixa>
        <Confirmacao>
          <TextoDaConfirmacao>{resumo()}</TextoDaConfirmacao>
          <TextoDaConfirmacao>
            Lançar o placar fecha a partida e faz o vencedor subir de rodada. Depois que a
            partida seguinte tiver resultado, isto não pode mais ser corrigido.
          </TextoDaConfirmacao>
        </Confirmacao>

        <Acoes>
          <Botao type="button" onClick={enviar} disabled={enviando}>
            {enviando ? 'Enviando...' : 'Confirmar e lançar'}
          </Botao>
          <BotaoNeutro type="button" onClick={() => setConfirmando(false)} disabled={enviando}>
            Voltar
          </BotaoNeutro>
        </Acoes>

        {erro && <Aviso $erro role="alert">{erro}</Aviso>}
      </Caixa>
    )
  }

  return (
    <Caixa>
      <Confronto>
        <LadoDoPlacar>
          <NomeDoLado>{nomeA}</NomeDoLado>
          <CampoDePlacar
            type="number"
            min={0}
            inputMode="numeric"
            aria-label={`Placar de ${nomeA}`}
            value={placarA}
            disabled={wo !== null}
            onChange={(e) => setPlacarA(e.target.value)}
          />
        </LadoDoPlacar>

        <LadoDoPlacar>
          <NomeDoLado>{nomeB}</NomeDoLado>
          <CampoDePlacar
            type="number"
            min={0}
            inputMode="numeric"
            aria-label={`Placar de ${nomeB}`}
            value={placarB}
            disabled={wo !== null}
            onChange={(e) => setPlacarB(e.target.value)}
          />
        </LadoDoPlacar>
      </Confronto>

      {/*
        * W.O. e placar são exclusivos — o schema da api recusa os dois juntos,
        * porque o corpo ficaria ambíguo. Marcar o W.O. desabilita os campos em
        * vez de apagá-los: quem marcou sem querer volta ao que digitou.
        */}
      <EscolhaDoWo>
        <input
          type="checkbox"
          checked={wo !== null}
          onChange={(e) => setWo(e.target.checked ? match.participantAId : null)}
        />
        Vitória por W.O. (sem placar)
      </EscolhaDoWo>

      {wo !== null && (
        <Confronto>
          <EscolhaDoWo>
            <input
              type="radio"
              name={`wo-${match.id}`}
              checked={wo === match.participantAId}
              onChange={() => setWo(match.participantAId)}
            />
            {nomeA} venceu
          </EscolhaDoWo>
          <EscolhaDoWo>
            <input
              type="radio"
              name={`wo-${match.id}`}
              checked={wo === match.participantBId}
              onChange={() => setWo(match.participantBId)}
            />
            {nomeB} venceu
          </EscolhaDoWo>
        </Confronto>
      )}

      <Acoes>
        <Botao type="button" disabled={bloqueio !== null} onClick={() => setConfirmando(true)}>
          Lançar placar
        </Botao>
        {onCancelar && (
          <BotaoNeutro type="button" onClick={onCancelar}>Cancelar</BotaoNeutro>
        )}
      </Acoes>

      {/* Por que o botão está desabilitado — escrito, e não adivinhado. */}
      {bloqueio && <Aviso>{bloqueio}</Aviso>}
      {erro && <Aviso $erro role="alert">{erro}</Aviso>}
    </Caixa>
  )
}
