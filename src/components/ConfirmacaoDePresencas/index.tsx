import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { playerService } from '../../services/playerService'
import type { Participation, Partida } from '../../types/api'
import { mensagemDeErro } from '../../utils/apiError'
import {
  AcoesDoModal,
  Estado,
  Lista,
  Mensagem,
  ModalContent,
  ModalOverlay,
  Nome,
  Participante,
  Subtitulo,
} from './styles'

interface ConfirmacaoDePresencasProps {
  partida: Partida
  onClose: () => void
  onSaved?: () => void
}

/**
 * Confirmação de presença compartilhada entre a lista e o detalhe da partida.
 *
 * O modal é responsável por buscar, editar e salvar a lista inteira. Quem o
 * renderiza só decide se o usuário pode abrir a ação — a API continua sendo a
 * autoridade final. Falhas de leitura ou gravação ficam visíveis sem desmontar
 * o modal, para o organizador poder tentar de novo sem refazer o caminho.
 */
export function ConfirmacaoDePresencas({ partida, onClose, onSaved }: ConfirmacaoDePresencasProps) {
  const [participantes, setParticipantes] = useState<Participation[]>([])
  const [presencas, setPresencas] = useState<Record<string, boolean>>({})
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erroAoCarregar, setErroAoCarregar] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErroAoCarregar(false)
    try {
      const resposta = await playerService.getEventParticipants(partida.courtId, partida.id)
      const lista = resposta.data ?? []
      setParticipantes(lista)
      setPresencas(Object.fromEntries(lista.map(p => [p.userId, p.attended !== false])))
    } catch (error) {
      setErroAoCarregar(true)
      toast.error(mensagemDeErro(error, 'Erro ao carregar participantes.'))
    } finally {
      setCarregando(false)
    }
  }, [partida.courtId, partida.id])

  useEffect(() => { void carregar() }, [carregar])

  const salvar = async () => {
    setSalvando(true)
    try {
      await Promise.all(participantes.map(p => (
        playerService.confirmAttendance(
          partida.courtId,
          partida.id,
          p.userId,
          presencas[p.userId] ?? true,
        )
      )))
      toast.success('Presenças confirmadas!')
      onSaved?.()
      onClose()
    } catch (error) {
      toast.error(mensagemDeErro(error, 'Erro ao salvar presenças.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <ModalOverlay onClick={() => !salvando && onClose()}>
      <ModalContent
        role="dialog"
        aria-modal="true"
        aria-label="Confirmar Presenças"
        onClick={event => event.stopPropagation()}
      >
        <h2>Confirmar Presenças</h2>
        <Subtitulo>
          {partida.court?.place?.name} &mdash; {new Date(partida.date).toLocaleDateString('pt-BR')}
        </Subtitulo>

        {carregando ? (
          <Mensagem>Carregando participantes...</Mensagem>
        ) : erroAoCarregar ? (
          <>
            <Mensagem $erro>Não foi possível carregar os participantes.</Mensagem>
            <AcoesDoModal>
              <button type="button" className="cancel" onClick={onClose}>Cancelar</button>
              <button type="button" className="submit" onClick={() => void carregar()}>Tentar novamente</button>
            </AcoesDoModal>
          </>
        ) : participantes.length === 0 ? (
          <Mensagem>Nenhum participante encontrado.</Mensagem>
        ) : (
          <Lista>
            {participantes.map(participacao => {
              const presente = presencas[participacao.userId] ?? true
              const nome = participacao.user?.name ?? participacao.userId
              return (
                <Participante
                  key={participacao.userId}
                  type="button"
                  $presente={presente}
                  aria-pressed={presente}
                  aria-label={`${nome}: ${presente ? 'Presente' : 'Ausente'}`}
                  onClick={() => setPresencas(atuais => ({
                    ...atuais,
                    [participacao.userId]: !presente,
                  }))}
                >
                  <Nome>{nome}</Nome>
                  <Estado $presente={presente}>{presente ? 'Presente' : 'Ausente'}</Estado>
                </Participante>
              )
            })}
          </Lista>
        )}

        {!erroAoCarregar && (
          <AcoesDoModal>
            <button type="button" className="cancel" onClick={onClose} disabled={salvando}>Cancelar</button>
            <button
              type="button"
              className="submit"
              onClick={() => void salvar()}
              disabled={salvando || carregando || participantes.length === 0}
            >
              {salvando ? 'Salvando...' : 'Salvar Presenças'}
            </button>
          </AcoesDoModal>
        )}
      </ModalContent>
    </ModalOverlay>
  )
}
