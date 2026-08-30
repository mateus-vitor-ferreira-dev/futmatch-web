import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { BotaoSeguir } from '../BotaoSeguir'
import { ChamarParaJogar } from '../ChamarParaJogar'
import { Skeleton } from '../Skeleton'
import type { PessoaDaRede } from '../../types/api'
import { BotaoChamar, Erro, Lista, MiniAvatar, NomeDaPessoa, Pessoa, Vazio } from './styles'

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
 *
 * ## E o botão de chamar para jogar (#380)
 *
 * A lista mostrava seis amigos e a única ação era **perder um**: "Seguindo",
 * cujo toque desfaz o vínculo. Faltava o caminho para o que a pessoa foi ali
 * fazer.
 *
 * **Ele aparece em todas as três abas**, e não só em Amigos. Era uma decisão
 * em aberto na issue, e o argumento que decide é o dela mesma: *chamar alguém
 * para jogar não devia exigir amizade*. Some só de quem já seguiu — o convite
 * é um link, e link não pede reciprocidade para funcionar.
 */
export function ListaDePessoas({ pessoas, carregando, erro, vazio }: Props) {
  // Quem está sendo chamado. Um por vez: o modal é único, e guardar a pessoa
  // (e não um booleano) é o que deixa o título dizer o nome dela.
  const [chamando, setChamando] = useState<PessoaDaRede | null>(null)

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
    // Fragmento, e não o modal dentro da `<ul>`: só `<li>` é filho válido de
    // lista, e um `<div>` ali dentro é HTML inválido que o leitor de tela lê
    // como item fantasma.
    <>
      <Lista>
        {pessoas.map((p) => (
        <Pessoa key={p.id}>
          <MiniAvatar aria-hidden>
            {p.avatarUrl ? <img src={p.avatarUrl} alt="" /> : iniciais(p.name)}
          </MiniAvatar>
          <NomeDaPessoa to={`/jogador/${p.id}`}>{p.name}</NomeDaPessoa>
          <BotaoChamar
            type="button"
            onClick={() => setChamando(p)}
            aria-label={`Chamar ${p.name} para jogar`}
          >
            <UserPlus size={14} aria-hidden />
            Chamar para jogar
          </BotaoChamar>
          <BotaoSeguir userId={p.id} nome={p.name} />
        </Pessoa>
        ))}
      </Lista>

      {chamando && (
        <ChamarParaJogar nome={chamando.name} onFechar={() => setChamando(null)} />
      )}
    </>
  )
}
