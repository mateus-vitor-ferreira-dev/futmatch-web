import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { perfilPublico } from '../../services/users'
import { followsService } from '../../services/follows'
import { chaves } from '../../lib/queryClient'
import { BotaoSeguir } from '../../components/BotaoSeguir'
import { ListaDePessoas } from '../../components/ListaDePessoas'
import { Skeleton } from '../../components/Skeleton'
import { SELOS } from '../../utils/requisitos'
import {
  Aba, Avatar, BackLink, Container, Contadores, Erro, Hero, Identidade,
  Nome, Reputacao,
} from './styles'

const iniciais = (nome: string) => nome.trim().charAt(0).toUpperCase()

type AbaAtiva = 'seguidores' | 'seguindo'

/**
 * A página de outra pessoa (web#375, api#387).
 *
 * ## Por que ela precisou existir
 *
 * `GET /users/:userId` está no ar desde sempre e o web nunca a chamou: não
 * havia tela de terceiro, e nome de participante não levava a lugar nenhum.
 * Sem um lugar onde a pessoa **é** o assunto, o botão de seguir não tinha onde
 * morar — e sem ele os dois requisitos de rede do portão recortavam uma rede
 * que ninguém conseguia formar.
 *
 * ## As duas listas são abas, e não páginas
 *
 * Seguidores e seguindo são a mesma rede vista dos dois lados, e as duas só
 * fazem sentido a partir de alguém. Rota própria para cada uma daria dois
 * endereços que ninguém digita e que, abertos sozinhos, não dizem de quem são.
 *
 * ## Os amigos não aparecem aqui
 *
 * A api só responde os mútuos **de quem está logado** (`/users/me/friends`), e
 * é uma decisão dela: a amizade de terceiros seria uma interseção que ninguém
 * pediu para publicar. Cruzar as duas listas no cliente para exibi-la assim
 * mesmo seria contornar a decisão por fora — quem olha vê a amizade **dele**
 * com esta pessoa, no selo ao lado do botão, e nada além.
 */
export default function Jogador() {
  const { userId = '' } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [aba, setAba] = useState<AbaAtiva>('seguidores')

  const pessoa = useQuery({
    queryKey: chaves.jogador(userId),
    queryFn: () => perfilPublico(userId).then((r) => r.data.data),
    enabled: Boolean(userId),
  })

  const seguidores = useQuery({
    queryKey: chaves.rede.seguidores(userId),
    queryFn: () => followsService.seguidores(userId),
    enabled: Boolean(userId),
  })

  const seguindo = useQuery({
    queryKey: chaves.rede.seguindo(userId),
    queryFn: () => followsService.seguindo(userId),
    enabled: Boolean(userId),
  })

  const voltar = () => navigate(-1)

  if (pessoa.isPending) {
    return (
      <Container>
        <Skeleton height="120px" />
      </Container>
    )
  }

  if (pessoa.isError || !pessoa.data) {
    return (
      <Container>
        <BackLink onClick={voltar}>
          <ArrowLeft size={16} aria-hidden /> Voltar
        </BackLink>
        <Erro role="alert">Não foi possível carregar este perfil.</Erro>
      </Container>
    )
  }

  const { name, avatarUrl, badge, stats } = pessoa.data
  const consultaDaAba = aba === 'seguidores' ? seguidores : seguindo

  return (
    <Container>
      <BackLink onClick={voltar}>
        <ArrowLeft size={16} aria-hidden /> Voltar
      </BackLink>

      <Hero>
        <Avatar aria-hidden>
          {avatarUrl ? <img src={avatarUrl} alt="" /> : iniciais(name)}
        </Avatar>

        <Identidade>
          <Nome>{name}</Nome>
          <Reputacao>
            {/*
              Nota nula é ausência, e não zero — a mesma distinção que o resto
              do produto faz. "Sem avaliações" é o que se lê de quem chegou
              agora; "⭐ 0,0" leria como jogador ruim.
            */}
            {stats.averageStars === null ? (
              'Sem avaliações ainda'
            ) : (
              <>
                <Star size={13} aria-hidden /> {stats.averageStars.toFixed(1)} ·{' '}
                {stats.totalReviews} {stats.totalReviews === 1 ? 'avaliação' : 'avaliações'}
              </>
            )}
            {badge && ` · ${SELOS[badge] ?? badge}`}
          </Reputacao>
          <Reputacao>
            {stats.totalPartidas} {stats.totalPartidas === 1 ? 'partida' : 'partidas'}
          </Reputacao>
        </Identidade>

        <BotaoSeguir userId={userId} nome={name} />
      </Hero>

      <Contadores role="tablist">
        <Aba
          type="button"
          role="tab"
          aria-selected={aba === 'seguidores'}
          $ativa={aba === 'seguidores'}
          onClick={() => setAba('seguidores')}
        >
          {seguidores.data?.length ?? 0} seguidores
        </Aba>
        <Aba
          type="button"
          role="tab"
          aria-selected={aba === 'seguindo'}
          $ativa={aba === 'seguindo'}
          onClick={() => setAba('seguindo')}
        >
          {seguindo.data?.length ?? 0} seguindo
        </Aba>
      </Contadores>

      <ListaDePessoas
        pessoas={consultaDaAba.data ?? []}
        carregando={consultaDaAba.isPending}
        erro={consultaDaAba.isError}
        vazio={
          aba === 'seguidores'
            ? `Ninguém segue ${name} ainda.`
            : `${name} ainda não segue ninguém.`
        }
      />

    </Container>
  )
}
