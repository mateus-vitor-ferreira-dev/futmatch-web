import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { followsService } from '../../services/follows'
import { chaves } from '../../lib/queryClient'
import { ListaDePessoas } from '../ListaDePessoas'
import { Aba, Abas, Explicacao } from './styles'

type AbaAtiva = 'amigos' | 'seguindo' | 'seguidores'

/**
 * A minha rede, na aba do perfil (web#375, api#387).
 *
 * ## Por que os amigos moram aqui, e não na página de terceiro
 *
 * `GET /users/me/friends` só responde sobre quem está logado. Não é limitação
 * de implementação: a amizade é derivada do follow mútuo, e publicá-la de
 * terceiros exporia uma interseção que nenhum dos dois lados pediu para
 * mostrar. Então a única tela onde ela cabe é a de "eu".
 *
 * ## A explicação fica na tela, e não só no código
 *
 * Amizade sem pedido nem aceite é diferente do que as pessoas esperam de um
 * app, e o preço aparece sozinho: alguém deixa de seguir e a amizade some sem
 * aviso. Escrever isso onde a lista está é mais barato que responder à dúvida
 * depois — e é a mesma frase que o portão usa quando recusa por `MUTUAL_FOLLOW`.
 */
export function MinhaRede() {
  const { user } = useAuth()
  const [aba, setAba] = useState<AbaAtiva>('amigos')
  const eu = user?.id

  const amigos = useQuery({
    queryKey: chaves.rede.meusAmigos(),
    queryFn: () => followsService.meusAmigos(),
    enabled: Boolean(eu),
  })

  const seguindo = useQuery({
    queryKey: chaves.rede.seguindo(eu ?? ''),
    queryFn: () => followsService.seguindo(eu!),
    enabled: Boolean(eu),
  })

  const seguidores = useQuery({
    queryKey: chaves.rede.seguidores(eu ?? ''),
    queryFn: () => followsService.seguidores(eu!),
    enabled: Boolean(eu),
  })

  const consultas = { amigos, seguindo, seguidores }
  const atual = consultas[aba]

  const vazios: Record<AbaAtiva, string> = {
    amigos:
      'Você ainda não tem amigos aqui. Amizade acontece quando você segue alguém que já te segue — não há convite a enviar.',
    seguindo:
      'Você ainda não segue ninguém. Abra o perfil de alguém que jogou com você e toque em Seguir.',
    seguidores: 'Ninguém te segue ainda.',
  }

  return (
    <div>
      <Abas role="tablist">
        <Aba
          type="button"
          role="tab"
          aria-selected={aba === 'amigos'}
          $ativa={aba === 'amigos'}
          onClick={() => setAba('amigos')}
        >
          {amigos.data?.length ?? 0} amigos
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
        <Aba
          type="button"
          role="tab"
          aria-selected={aba === 'seguidores'}
          $ativa={aba === 'seguidores'}
          onClick={() => setAba('seguidores')}
        >
          {seguidores.data?.length ?? 0} seguidores
        </Aba>
      </Abas>

      {aba === 'amigos' && (
        <Explicacao>
          Amigo é quem você segue e que segue você de volta. Ninguém aceita nada — e a
          amizade desfaz sozinha se um dos dois deixar de seguir.
        </Explicacao>
      )}

      <ListaDePessoas
        pessoas={atual.data ?? []}
        carregando={atual.isPending}
        erro={atual.isError}
        vazio={vazios[aba]}
      />
    </div>
  )
}
