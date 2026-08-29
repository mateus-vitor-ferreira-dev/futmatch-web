import { MinhaRede } from '../../components/MinhaRede'
import { Cabecalho, Container, Subtitulo, Titulo } from './styles'

/**
 * A minha rede — seguidores, seguindo e amigos (web#375, api#387).
 *
 * ## Por que é uma página, e não uma aba do perfil
 *
 * Começou como aba dentro de `/perfil`, pela ideia de que os amigos são "dado
 * meu": a api só responde os mútuos de quem está logado. Só que perfil é onde
 * se **configura** a conta — nome, senha, endereço, modalidades —, e rede é
 * onde se **usa** o produto. Quem quer ver quem o segue procura no menu, não
 * dentro das configurações.
 *
 * Isso apareceu na primeira vez que alguém foi olhar as telas novas e não as
 * encontrou. O caminho existia; ninguém adivinharia.
 *
 * ## O conteúdo continua no componente
 *
 * `MinhaRede` guarda as três consultas e as abas, e permanece um componente
 * para não amarrar essa lógica a esta rota — se um dia a rede aparecer também
 * dentro de outra tela, ela vem inteira.
 */
export default function Rede() {
  return (
    <Container>
      <Cabecalho>
        <Titulo>Minha Rede</Titulo>
        <Subtitulo>
          Quem você segue, quem te segue e as amizades que nasceram dos dois lados.
        </Subtitulo>
      </Cabecalho>

      <MinhaRede />
    </Container>
  )
}
