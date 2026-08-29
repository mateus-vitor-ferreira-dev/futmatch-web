import { Check, UserPlus, Users } from 'lucide-react'
import { useRedeSocial } from '../../hooks/useRedeSocial'
import { useAuth } from '../../contexts/AuthContext'
import { Botao, Linha, SeloDeAmizade } from './styles'

interface Props {
  /** De quem é o perfil. */
  userId: string
  /** O nome, só para o rótulo acessível — o botão em si não o mostra. */
  nome: string
}

/**
 * Seguir e deixar de seguir, em qualquer lugar que mostre uma pessoa (api#387).
 *
 * ## Não aparece para si mesmo
 *
 * A api recusa seguir a si próprio, e um botão que só existe para levar 422 é
 * pior que botão nenhum: quem toca conclui que quebrou. Some, e o perfil da
 * própria pessoa fica sem ele.
 *
 * ## Não pergunta antes de desfazer
 *
 * Deixar de seguir não destrói nada que custe a refazer — um toque desfaz o
 * desfeito. Confirmação aqui seria fricção sobre a ação reversível e barata,
 * que é o tipo de diálogo que as pessoas aprendem a fechar sem ler.
 *
 * A amizade **some junto**, e isso sim é consequência que não se recupera
 * sozinha: ela depende do outro lado. Por isso o rótulo do estado de amizade
 * fica visível ao lado do botão, e não escondido dentro dele.
 */
export function BotaoSeguir({ userId, nome }: Props) {
  const { user } = useAuth()
  const { sigo, ehAmigo, seguir, deixarDeSeguir, alterando, carregando } = useRedeSocial()

  // Sem sessão não há de quem falar, e o próprio usuário não se segue.
  if (!user || user.id === userId) return null

  const seguindo = sigo(userId)
  const amigo = ehAmigo(userId)
  const ocupado = alterando(userId)

  return (
    <Linha>
      <Botao
        type="button"
        $seguindo={seguindo}
        disabled={ocupado || carregando}
        onClick={() => (seguindo ? deixarDeSeguir(userId) : seguir(userId))}
        aria-label={seguindo ? `Deixar de seguir ${nome}` : `Seguir ${nome}`}
        /*
          `aria-pressed` porque o botão é um interruptor, e não uma ação nova a
          cada toque: o leitor de tela anuncia o estado em vez de obrigar quem
          usa a deduzi-lo do rótulo que mudou.
        */
        aria-pressed={seguindo}
      >
        {seguindo ? <Check size={16} aria-hidden /> : <UserPlus size={16} aria-hidden />}
        {seguindo ? 'Seguindo' : 'Seguir'}
      </Botao>

      {amigo && (
        <SeloDeAmizade>
          <Users size={13} aria-hidden />
          Amigos
        </SeloDeAmizade>
      )}
    </Linha>
  )
}
