/**
 * O convite para dizer de onde a pessoa sai.
 *
 * Por que ele saiu de dentro da home
 * ----------------------------------
 * A recomendação por proximidade chegou ao ar, e **nenhum cadastro pede
 * endereço** — nem o de e-mail, nem o do Google. Todo jogador novo cai no app
 * sem origem para medir distância (#328).
 *
 * O convite existia em dois lugares, cada um com sua cópia: dentro da seção
 * "Partidas perto de você", na home, e dentro dos **filtros avançados** da
 * busca — que nascem fechados, então quem abre a busca sem origem não via nada.
 * Este componente é o mesmo convite nos dois lugares, e some sozinho no
 * instante em que passa a existir origem, por qualquer das duas vias.
 *
 * Onde ele aparece, e por que não em toda tela
 * --------------------------------------------
 * Só onde a falta de origem tem **consequência visível**: a home e a busca. A
 * alternativa considerada era uma faixa no topo do app, que alcançaria também
 * quem entra por link de convite e nunca abre a home — mas faixa em toda tela é
 * banner, e banner se aprende a ignorar. A #328 registra as três opções e
 * recomenda esta.
 *
 * O que a web#222 ensinou, e vale aqui
 * ------------------------------------
 * **Prompt de permissão disparado sem contexto é negado quase sempre, e
 * navegador nenhum pergunta de novo.** É uma chance só. Por isso o pedido nasce
 * sempre de um clique, depois de a tela explicar para quê — nunca na montagem.
 *
 * Quem é dono do estado
 * ---------------------
 * A origem vem por **prop**, de quem já chama o `useOrigemDeLocalizacao` para
 * decidir o que mostrar na tela. Chamar o hook aqui dentro pareceu mais limpo e
 * está errado: cada chamada tem estado próprio, então o clique em "usar minha
 * localização" atualizaria o convite e **não** a tela que o contém — a lista
 * continuaria dizendo que não sabe de onde medir, com a permissão já concedida.
 * Pego pelo teste do `PartidasPerto`, que clica no botão e cobra a busca com a
 * coordenada nova.
 *
 * O dispensar
 * -----------
 * Quem dispensa não vê mais, e a escolha é lembrada entre sessões — o mesmo
 * tratamento que a preferência de localização já recebe. Convite que volta a
 * cada visita depois de recusado é o que faz a pessoa aprender a não ler.
 */

import { useState } from 'react'
import { MapPin, Navigation, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { OrigemDeLocalizacao } from '../../hooks/useOrigemDeLocalizacao'
import { foiDispensado, guardeDispensa } from './dispensa'
import { Caixa, Acoes, BotaoPrimario, BotaoSecundario, Dispensar } from './styles'

interface Props {
  /**
   * A frase que abre o convite. Muda com o lugar: na home o assunto é o que há
   * por perto; na busca, é o filtro de distância que não tem como medir.
   */
  contexto: string
  /** O retorno do `useOrigemDeLocalizacao` de quem contém o convite. */
  localizacao: OrigemDeLocalizacao
}

export default function ConviteDeLocalizacao({ contexto, localizacao }: Props) {
  const navigate = useNavigate()
  const { estado, pedindo, pedirLocalizacao, podePedir } = localizacao
  // Lido uma vez, na montagem: o `localStorage` não muda sozinho durante a
  // vida do componente, e o clique do dispensar já atualiza o estado.
  const [dispensado, setDispensado] = useState(foiDispensado)

  // `pedindo` fica de fora do "sem origem" de propósito: enquanto o prompt do
  // navegador está aberto, trocar o convite por outra coisa mexeria na tela
  // exatamente durante a decisão.
  const semOrigem = estado !== 'pronto' && estado !== 'pedindo'

  if (!semOrigem || pedindo || dispensado) return null

  return (
    <Caixa role="region" aria-label="Informe de onde você sai">
      <Dispensar type="button" aria-label="Dispensar este convite" onClick={() => {
          guardeDispensa()
          setDispensado(true)
        }}>
        <X size={16} aria-hidden />
      </Dispensar>

      <p>
        {contexto}{' '}
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
    </Caixa>
  )
}
