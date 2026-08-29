import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { followsService } from '../../services/follows'
import { chaves } from '../../lib/queryClient'
import { ListaDePessoas } from '../../components/ListaDePessoas'
import { Aba, Abas, Cabecalho, Container, Explicacao, Subtitulo, Titulo } from './styles'

type AbaAtiva = 'amigos' | 'seguidores' | 'seguindo'

/**
 * Amigos — e, com eles, quem te segue e quem você segue (web#375, api#387).
 *
 * ## O nome
 *
 * Chamava-se "Minha Rede", e ninguém sabia o que era. O produto tem uma palavra
 * própria para o follow mútuo — **amigo** —, e ela não é enfeite: é o nome de
 * uma regra de entrada que o organizador escolhe ("Meus amigos"), e a recusa da
 * api fala nela. Um menu que dissesse outra coisa daria dois nomes para o mesmo
 * conceito, e um dos dois envelheceria.
 *
 * ## As abas seguem o perfil do Instagram
 *
 * **Seguidores antes de Seguindo**, com o contador junto do rótulo. É a ordem
 * que as pessoas já leem em outro lugar, e inverter obrigaria a conferir qual é
 * qual toda vez.
 *
 * Amigos vem primeiro porque é a única das três que só existe aqui: seguidores
 * e seguindo de qualquer pessoa também aparecem na página dela.
 *
 * ## Por que a amizade não tem convite
 *
 * A explicação fica na tela, e não só no código: amizade sem pedido nem aceite
 * é diferente do que as pessoas esperam, e o preço aparece sozinho — alguém
 * deixa de seguir e a amizade some sem aviso. Escrever isso onde a lista está é
 * mais barato que responder à dúvida depois.
 */
export default function Amigos() {
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
    <Container>
      <Cabecalho>
        <Titulo>Amigos</Titulo>
        <Subtitulo>
          Amigo é quem você segue e que segue você de volta. Aqui também estão quem te
          segue e quem você segue.
        </Subtitulo>
      </Cabecalho>

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
    </Container>
  )
}
