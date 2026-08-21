import { Link2, Lock } from 'lucide-react'
import type { PeladaVisibility } from '../../types/api'
import { Marca } from './styles'

interface Props {
  visibility?: PeladaVisibility
}

const MARCAS = {
  LINK: {
    rotulo: 'Por link',
    titulo: 'Fora da busca. Quem tem o endereço abre e entra.',
    Icone: Link2,
  },
  PRIVATE: {
    rotulo: 'Privada',
    titulo: 'Fora da busca, e o endereço sozinho não abre.',
    Icone: Lock,
  },
} as const

/**
 * A marca de que esta pelada **não está listada** (#227).
 *
 * **Pelada pública não ganha marca nenhuma.** Ela é a esmagadora maioria, e
 * carimbar "pública" em todas transformaria o normal em aviso e o aviso em
 * ruído — a marca existe justamente porque `LINK` e `PRIVATE` são a exceção.
 *
 * O organizador é quem mais precisa dela: ele escolheu a visibilidade uma vez,
 * na criação, e depois não tem como saber o que escolheu sem abrir a edição. A
 * pelada some da busca em silêncio, e "por que ninguém está entrando?" é uma
 * pergunta cuja resposta cabe num rótulo.
 */
export function MarcaDeVisibilidade({ visibility }: Props) {
  if (!visibility || visibility === 'PUBLIC') return null

  const { rotulo, titulo, Icone } = MARCAS[visibility]

  return (
    // O `title` é a explicação para quem passa o mouse; o `aria-label` repete o
    // rótulo com contexto, porque "Por link" sozinho não diz do que se trata.
    <Marca title={titulo} aria-label={`Visibilidade: ${rotulo}. ${titulo}`}>
      <Icone size={12} aria-hidden />
      {rotulo}
    </Marca>
  )
}
