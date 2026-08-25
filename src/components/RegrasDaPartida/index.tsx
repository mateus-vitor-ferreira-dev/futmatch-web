import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { playerService } from '../../services/playerService'
import { teamsService } from '../../services/teams'
import { chaves } from '../../lib/queryClient'
import type { Partida, PartidaRequirement, PartidaVisibility } from '../../types/api'
import { mensagemDeErro } from '../../utils/apiError'
import { ConfiguracaoDeAcesso } from '../ConfiguracaoDeAcesso'
import {
  AcoesDoModal,
  Mensagem,
  ModalContent,
  ModalOverlay,
  NotaDeEfeito,
  Subtitulo,
} from './styles'

interface Props {
  partida: Partida
  onClose: () => void
  onSaved?: () => void
}

/** O que precisa ser dito antes de salvar, quando a regra é impossível de cumprir. */
function problema(requisitos: PartidaRequirement[]): string | null {
  const selo = requisitos.find((r) => r.type === 'BADGE')
  if (selo && (selo.params?.badges?.length ?? 0) === 0) {
    return 'Marque ao menos um selo, ou remova a regra de selo.'
  }

  const time = requisitos.find((r) => r.type === 'TEAM_MEMBER')
  if (time && !time.params?.teamId) {
    return 'Escolha o time, ou remova a regra de time.'
  }

  return null
}

/**
 * As regras de acesso de uma partida que já existe (#228).
 *
 * Editar é o momento em que o organizador mexe na regra **com gente dentro**, e
 * por isso a tela diz o que acontece com quem já entrou antes de ele salvar: a
 * API não reavalia participação existente, e requisito novo não expulsa
 * ninguém. Sem essa frase, mudar a regra parece uma ação com risco
 * indeterminado — e a dúvida é o que faz o organizador não mexer.
 *
 * O salvamento é um **diff**: só vai para a API o que mudou. Reenviar tudo
 * funcionaria e custaria uma escrita por regra a cada confirmação, inclusive
 * quando nada mudou.
 */
export function RegrasDaPartida({ partida, onClose, onSaved }: Props) {
  const [visibilidade, setVisibilidade] = useState<PartidaVisibility>(partida.visibility ?? 'PUBLIC')
  const [requisitos, setRequisitos] = useState<PartidaRequirement[]>([])
  const [originais, setOriginais] = useState<PartidaRequirement[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroAoCarregar, setErroAoCarregar] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const { data: times = [] } = useQuery({
    queryKey: chaves.times.meus(),
    queryFn: () => teamsService.meusTimes(),
  })

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErroAoCarregar(false)
    try {
      const resposta = await playerService.listRequirements(partida.courtId, partida.id)
      const lista = resposta.data ?? []
      setRequisitos(lista)
      setOriginais(lista)
    } catch (error) {
      setErroAoCarregar(true)
      toast.error(mensagemDeErro(error, 'Erro ao carregar as regras da partida.'))
    } finally {
      setCarregando(false)
    }
  }, [partida.courtId, partida.id])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const salvar = async () => {
    const impedimento = problema(requisitos)
    if (impedimento) {
      toast.error(impedimento)
      return
    }

    setSalvando(true)
    try {
      if (visibilidade !== (partida.visibility ?? 'PUBLIC')) {
        await playerService.updateEventVisibility(partida.courtId, partida.id, visibilidade)
      }

      const agora = new Set(requisitos.map((r) => r.type))
      const removidos = originais.filter((r) => !agora.has(r.type))
      const mudados = requisitos.filter((r) => {
        const antes = originais.find((o) => o.type === r.type)
        return !antes || JSON.stringify(antes.params) !== JSON.stringify(r.params)
      })

      // Remove antes de anexar. A ordem só importa se um dia a API limitar a
      // quantidade de requisitos por partida — e nessa hora, remover primeiro é
      // o que deixa a troca caber.
      for (const requisito of removidos) {
        await playerService.deleteRequirement(partida.courtId, partida.id, requisito.type)
      }
      for (const requisito of mudados) {
        await playerService.upsertRequirement(
          partida.courtId,
          partida.id,
          requisito.type,
          requisito.params ?? {},
        )
      }

      toast.success('Regras atualizadas!')
      onSaved?.()
      onClose()
    } catch (error) {
      // O modal fica aberto: o organizador acabou de montar a configuração, e
      // fechar aqui o obrigaria a refazer tudo para tentar de novo.
      toast.error(mensagemDeErro(error, 'Erro ao salvar as regras.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <ModalOverlay onClick={() => !salvando && onClose()}>
      <ModalContent
        role="dialog"
        aria-modal="true"
        aria-label="Regras de acesso"
        onClick={(event) => event.stopPropagation()}
      >
        <h2>Regras de acesso</h2>
        <Subtitulo>
          {partida.court?.place?.name} &mdash; {new Date(partida.date).toLocaleDateString('pt-BR')}
        </Subtitulo>

        {carregando ? (
          <Mensagem>Carregando as regras...</Mensagem>
        ) : erroAoCarregar ? (
          <>
            <Mensagem $erro>Não foi possível carregar as regras desta partida.</Mensagem>
            <AcoesDoModal>
              <button type="button" className="cancel" onClick={onClose}>
                Cancelar
              </button>
              <button type="button" className="submit" onClick={() => void carregar()}>
                Tentar novamente
              </button>
            </AcoesDoModal>
          </>
        ) : (
          <>
            <NotaDeEfeito>
              Quem já entrou continua na partida: regra nova não expulsa ninguém e não é reavaliada.
              A mudança vale para quem tentar entrar de agora em diante.
            </NotaDeEfeito>

            <ConfiguracaoDeAcesso
              visibilidade={visibilidade}
              aoMudarVisibilidade={setVisibilidade}
              requisitos={requisitos}
              aoMudarRequisitos={setRequisitos}
              times={times}
              desabilitado={salvando}
            />

            <AcoesDoModal>
              <button type="button" className="cancel" onClick={onClose} disabled={salvando}>
                Cancelar
              </button>
              <button type="button" className="submit" onClick={() => void salvar()} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar regras'}
              </button>
            </AcoesDoModal>
          </>
        )}
      </ModalContent>
    </ModalOverlay>
  )
}
