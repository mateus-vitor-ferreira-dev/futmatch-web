import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Clock, MapPin, Navigation, Users } from 'lucide-react'
import { recommendedEvents } from '../../services/events'
import { chaves } from '../../lib/queryClient'
import { getSportMeta } from '../../hooks/useSports'
import { useOrigemDeLocalizacao } from '../../hooks/useOrigemDeLocalizacao'
import type { CourtType } from '../../types/api'
import {
  Acoes,
  Bloco,
  BotaoPrimario,
  BotaoSecundario,
  Cabecalho,
  Cartao,
  Convite,
  Distancia,
  Esqueleto,
  Grade,
  Linha,
  Local,
  Subtitulo,
  Titulo,
  TopoDoCartao,
  Vazio,
} from './styles'

/** Passos de raio, para o "ampliar" do estado vazio. O teto da API é 100 km. */
const RAIOS = [10, 25, 50, 100]

/**
 * "Partidas perto de você", na home (#223 e #222).
 *
 * A recomendação existe na API desde a api#217 e **ninguém a via**: para chegar
 * nela o jogador precisava ir à busca e montar um filtro. Ela só vira produto
 * quando aparece sozinha na primeira tela.
 *
 * ## Os dois vazios não são o mesmo vazio
 *
 * A API distingue, e a tela precisa distinguir junto. `NO_LOCATION` quer dizer
 * que não sabemos de onde medir — e aí o certo é **convidar**: liberar a
 * localização ou salvar o endereço. `NO_EVENTS_NEARBY` quer dizer que a busca
 * funcionou e não há partida por perto — e aí o certo é **ampliar o raio**.
 * Mostrar "nada por perto" para quem nunca informou onde mora seria mentir
 * sobre a cidade inteira.
 *
 * ## O prompt de permissão não sai daqui sozinho
 *
 * Ele sai de um clique, depois do texto que explica para quê (#222). Permissão
 * pedida sem contexto é negada quase sempre, e navegador nenhum pergunta de
 * novo — é uma chance só.
 */
export function PartidasPerto() {
  const navigate = useNavigate()
  const { origem, estado, pedindo, pedirLocalizacao, podePedir } = useOrigemDeLocalizacao()
  const [raioKm, setRaioKm] = useState(RAIOS[0])

  const {
    data: recomendacoes,
    isPending,
    isError,
  } = useQuery({
    queryKey: chaves.eventos.recomendadas(origem, raioKm),
    queryFn: () =>
      recommendedEvents({
        latitude: origem?.latitude,
        longitude: origem?.longitude,
        radiusKm: raioKm,
      }).then((r) => r.data),
    // Sem origem nenhuma a resposta seria `NO_LOCATION` garantido: a requisição
    // só gastaria viagem para confirmar o que o front já sabe.
    enabled: estado === 'pronto',
  })

  const semOrigem = estado !== 'pronto' && estado !== 'pedindo'
  const proximoRaio = RAIOS.find((raio) => raio > raioKm)

  return (
    <Bloco aria-labelledby="titulo-perto">
      <Cabecalho>
        <div>
          <Titulo id="titulo-perto">Partidas perto de você</Titulo>
          <Subtitulo>
            {estado === 'pronto' && recomendacoes?.events.length
              ? `Num raio de ${raioKm} km${origem?.fonte === 'endereco' ? ', a partir do seu endereço' : ''}`
              : 'As que dá para chegar a pé, de bike ou num pulo de carro.'}
          </Subtitulo>
        </div>
      </Cabecalho>

      {semOrigem ? (
        <Convite>
          <p>
            Para mostrar o que tem por perto, precisamos saber de onde você sai.{' '}
            {estado === 'negado'
              ? 'Você não liberou a localização — dá para usar o endereço do perfil no lugar.'
              : estado === 'indisponivel'
                ? 'Este navegador não informa localização, então vale o endereço do perfil.'
                : 'Pode ser a localização do navegador, agora, ou o endereço salvo no perfil.'}
          </p>
          <Acoes>
            {podePedir && (
              <BotaoPrimario type="button" onClick={pedirLocalizacao}>
                <Navigation size={15} aria-hidden />
                Usar minha localização
              </BotaoPrimario>
            )}
            <BotaoSecundario type="button" onClick={() => navigate('/perfil')}>
              <MapPin size={15} aria-hidden />
              Salvar meu endereço
            </BotaoSecundario>
          </Acoes>
        </Convite>
      ) : isPending || pedindo ? (
        // Esqueletos, e não uma frase: a seção precisa ocupar o mesmo espaço
        // antes e depois de carregar, senão empurra a home no meio da leitura.
        <Grade aria-busy="true" aria-live="polite">
          <Esqueleto />
          <Esqueleto />
          <Esqueleto />
        </Grade>
      ) : isError ? (
        <Vazio role="status">
          Não foi possível carregar as partidas por perto agora. O resto da home continua aí.
        </Vazio>
      ) : recomendacoes && recomendacoes.events.length > 0 ? (
        <Grade>
          {recomendacoes.events.map((partida) => {
            const esporte = getSportMeta(partida.court?.type as CourtType)
            const confirmados = partida._count?.participations ?? 0

            return (
              <Cartao
                key={partida.id}
                type="button"
                onClick={() => navigate(`/partida/${partida.id}`)}
                aria-label={`${partida.court?.place?.name ?? 'Partida'}, a ${partida.distanceKm} km`}
              >
                <TopoDoCartao>
                  <Local>
                    {esporte.icon} {partida.court?.place?.name ?? 'Partida'}
                  </Local>
                  <Distancia>
                    <Navigation size={11} aria-hidden />
                    {partida.distanceKm} km
                  </Distancia>
                </TopoDoCartao>

                <Linha>
                  <Clock size={13} aria-hidden />
                  {new Date(partida.date).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Linha>
                <Linha>
                  <Users size={13} aria-hidden />
                  {confirmados}/{partida.maxPlayers} confirmados
                </Linha>
                <Linha>
                  <MapPin size={13} aria-hidden />
                  {partida.court?.place?.city}
                </Linha>
              </Cartao>
            )
          })}
        </Grade>
      ) : (
        <Vazio role="status">
          Nenhuma partida aberta num raio de {raioKm} km.{' '}
          {proximoRaio ? (
            <>
              <BotaoSecundario
                type="button"
                onClick={() => setRaioKm(proximoRaio)}
                style={{ marginTop: 12 }}
              >
                Procurar em {proximoRaio} km
              </BotaoSecundario>
            </>
          ) : (
            'Este já é o maior raio que a busca alcança.'
          )}
        </Vazio>
      )}
    </Bloco>
  )
}
