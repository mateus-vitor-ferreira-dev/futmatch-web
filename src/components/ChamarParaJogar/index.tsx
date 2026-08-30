import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { playerService } from '../../services/playerService'
import { chaves } from '../../lib/queryClient'
import CompartilharPartida from '../CompartilharPartida'
import { Skeleton } from '../Skeleton'
import { podeReceberGente } from '../../utils/partidasParaChamar'
import type { Partida } from '../../types/api'
import {
  ModalOverlay, ModalContent, Subtitulo, ListaDePartidas, PartidaBotao,
  Vazio, BotaoPrincipal, Fechar, Erro,
} from './styles'

const quando = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    .format(new Date(iso))

/**
 * Chamar alguém para jogar, a partir da lista de amigos (#380).
 *
 * ## Por que só as partidas que EU organizo
 *
 * A issue falava em "as suas partidas futuras em que ainda há vaga" e citava as
 * duas rotas — `/events/my/created` e `/my/participating`. **Só a primeira
 * serve**, e isso foi conferido na api: o `inviteRouter` inteiro é guardado por
 * `isOrganizerOrAdmin`, então criar ou listar link de uma partida em que eu só
 * participo responde **403**.
 *
 * Oferecer essas partidas aqui levaria a pessoa a um modal que falha depois de
 * ela ter escolhido — pior que não oferecer, porque o erro chega no fim do
 * caminho e parece defeito.
 *
 * ## O que este modal NÃO é
 *
 * Não é um convite endereçado. O que sai daqui é o **link** da #225, que
 * qualquer um que o receba pode usar até o limite configurado — e a tela diz
 * isso, em vez de dar a entender que o fulano recebeu alguma coisa.
 *
 * O convite de verdade, que chega no sininho de quem foi chamado, depende da
 * `so-mais-um-api#464`. Quando ela sair, é este componente que troca o
 * compartilhamento pelo convite, e a tela não muda de lugar.
 */
export function ChamarParaJogar({ nome, onFechar }: { nome: string; onFechar: () => void }) {
  const navigate = useNavigate()
  const [escolhida, setEscolhida] = useState<Partida | null>(null)

  const { data: partidas = [], isPending, isError } = useQuery({
    queryKey: chaves.eventos.criados(),
    queryFn: async () => (await playerService.getMyCreatedEvents()).data ?? [],
  })

  const disponiveis = partidas.filter((p) => podeReceberGente(p))

  // Escolhida a partida, o modal de link assume — é o mesmo `CompartilharPartida`
  // de Minhas Partidas e do detalhe, e não um segundo lugar que gera link.
  if (escolhida) {
    return <CompartilharPartida partida={escolhida} onFechar={onFechar} />
  }

  return (
    <ModalOverlay onClick={onFechar} role="presentation">
      <ModalContent
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Chamar ${nome} para jogar`}
      >
        <h2>Chamar {nome} para jogar</h2>

        {isPending ? (
          <>
            <Skeleton height="60px" />
            <Skeleton height="60px" />
          </>
        ) : isError ? (
          <Erro role="alert">Não foi possível carregar as suas partidas.</Erro>
        ) : disponiveis.length > 0 ? (
          <>
            <Subtitulo>
              Escolha uma das suas partidas. Você recebe um link para mandar para {nome} pelo
              canal que vocês já usam.
            </Subtitulo>
            <ListaDePartidas>
              {disponiveis.map((p) => (
                <li key={p.id}>
                  <PartidaBotao type="button" onClick={() => setEscolhida(p)}>
                    <strong>{p.court?.place?.name ?? 'Partida'}</strong>
                    <span>
                      {quando(p.date)} · {p._count?.participations ?? 0}/{p.maxPlayers} confirmados
                    </span>
                  </PartidaBotao>
                </li>
              ))}
            </ListaDePartidas>
          </>
        ) : (
          /*
            Sem partida com vaga, o caminho é criar — e não um vazio.
            Quem tocou "chamar para jogar" já decidiu que quer jogar com essa
            pessoa; faltar partida é um passo a dar, não um beco.
          */
          <Vazio>
            <p>
              Você não tem nenhuma partida futura com vaga. Crie uma e chame {nome} logo em
              seguida.
            </p>
            <BotaoPrincipal type="button" onClick={() => navigate('/criar-partida')}>
              Criar Partida
            </BotaoPrincipal>
          </Vazio>
        )}

        <Fechar type="button" onClick={onFechar}>Fechar</Fechar>
      </ModalContent>
    </ModalOverlay>
  )
}
