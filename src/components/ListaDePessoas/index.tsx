import { BotaoSeguir } from '../BotaoSeguir'
import { Skeleton } from '../Skeleton'
import type { PessoaDaRede } from '../../types/api'
import { Erro, Lista, MiniAvatar, NomeDaPessoa, Pessoa, Vazio } from './styles'

interface Props {
  pessoas: PessoaDaRede[]
  carregando: boolean
  erro: boolean
  /** O que se lê quando a lista está vazia. Muda com a lista, então vem de fora. */
  vazio: string
}

const iniciais = (nome: string) => nome.trim().charAt(0).toUpperCase()

/**
 * Uma lista de gente da rede — seguidores, seguindo ou amigos (web#375).
 *
 * As três listas são a mesma coisa desenhada: avatar, nome que leva ao perfil,
 * e o botão de seguir. O que muda entre elas é **de quem** é a lista e a frase
 * do vazio — e é só isso que entra por props.
 *
 * ## O botão fica em cada linha, e não só no perfil
 *
 * Ver quem alguém segue é o caminho mais curto para encontrar gente: quem
 * chegou aqui está olhando uma lista de pessoas que já lhe interessam. Obrigar
 * a abrir cada perfil para seguir custaria uma navegação por pessoa.
 *
 * O botão some sozinho na própria linha de quem está logado — ele não aparece
 * para si mesmo —, então a lista não precisa filtrar nada.
 */
export function ListaDePessoas({ pessoas, carregando, erro, vazio }: Props) {
  if (carregando) {
    return (
      <Lista aria-busy>
        <Skeleton height="60px" />
        <Skeleton height="60px" />
      </Lista>
    )
  }

  if (erro) return <Erro role="alert">Não foi possível carregar esta lista.</Erro>

  if (pessoas.length === 0) return <Vazio>{vazio}</Vazio>

  return (
    <Lista>
      {pessoas.map((p) => (
        <Pessoa key={p.id}>
          <MiniAvatar aria-hidden>
            {p.avatarUrl ? <img src={p.avatarUrl} alt="" /> : iniciais(p.name)}
          </MiniAvatar>
          <NomeDaPessoa to={`/jogador/${p.id}`}>{p.name}</NomeDaPessoa>
          <BotaoSeguir userId={p.id} nome={p.name} />
        </Pessoa>
      ))}
    </Lista>
  )
}
