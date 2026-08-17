import type { ReactNode } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { diasDeToleranciaRestantes } from '../../hooks/useSubscription'
import type { SubscriptionStatus } from '../../types/api'
import { Overlay, Aviso, AvisoTexto, AvisoBtn, Carregando } from './styles'

/**
 * Onde o dono assina ou gerencia a assinatura.
 *
 * `/owner/plans` e não `/owner/dashboard`: quem chega aqui está **sem**
 * assinatura em dia, e o que resolve isso é escolher plano e pagar, que só a
 * grade faz. O painel é para acompanhar uso de quem já assina. Os dois destinos
 * conviviam — o portão mandava para um, o aviso do Estoque para o outro — e é
 * uma das coisas que a #244 pediu para decidir.
 */
const ROTA_ASSINATURA = '/owner/plans'

export interface SubscriptionGateProps {
  isActive: boolean
  loading: boolean
  /**
   * Assinatura crua, só para o aviso de atraso. Opcional: sem ela o componente
   * continua funcionando, apenas sem avisar quem está em `past_due`.
   */
  sub?: SubscriptionStatus | null
  children: ReactNode
}

/**
 * Diz em que pé está a assinatura, acima do conteúdo da tela.
 *
 * **Não esconde nada, e é isso que mudou na #244.** Antes, sem assinatura, ele
 * apagava a tela a 25% e cobria tudo com um cartão de "Assinatura necessária" —
 * enquanto o Estoque, na mesma navegação lateral, deixava consultar e só travava
 * a edição. Quem clicava pelo menu via o produto mudar de regra a cada tela, sem
 * nada explicando por quê.
 *
 * O servidor já tinha a resposta: `requireActiveSubscription` está só nos
 * `POST`/`PATCH`/`DELETE`. **Leitura é livre; escrita exige assinatura.** Quem
 * seguia o contrato era o Estoque, e as outras quatro telas escondiam dado que a
 * API entrega sem reclamar — o portão chegava a carregar os números e depois
 * apagá-los na tela.
 *
 * Não é só estética: o dono com pagamento atrasado perdia o acesso de leitura ao
 * próprio negócio justamente quando mais precisa dele, para conferir o que tem e
 * decidir se renova.
 *
 * O bloqueio da escrita não some — mudou de lugar. Ele agora é o `podeAlterar`
 * do `useSubscription`, que desabilita o botão de cada ação. Este componente
 * responde só por *avisar*.
 *
 * Três estados:
 *
 *  1. **verificando** — conteúdo visível e inerte, com "Verificando assinatura…".
 *     É a única situação em que ele ainda segura o clique, e precisa continuar
 *     assim: liberar aqui é o beco que a #119 fechou no servidor;
 *  2. **sem assinatura em dia** — faixa dizendo que dá para consultar e não para
 *     alterar, com o caminho da assinatura. O conteúdo fica normal;
 *  3. **em atraso, dentro da tolerância** — faixa avisando quantos dias restam.
 *     Nada bloqueado, nem aqui nem no servidor.
 */
export default function SubscriptionGate({ isActive, loading, sub, children }: SubscriptionGateProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ opacity: 0.45, pointerEvents: 'none', userSelect: 'none' }}>
          {children}
        </div>
        <Overlay>
          <Carregando role="status">
            <Loader2 size={16} />
            Verificando assinatura…
          </Carregando>
        </Overlay>
      </div>
    )
  }

  if (!isActive) {
    return (
      <>
        <Aviso role="status">
          <AlertTriangle size={16} />
          {/* Sem nome de plano no texto: ele vem do banco desde a #118 e virou
              uma grade na #112. Cópia que nomeia plano envelhece no deploy. */}
          <AvisoTexto>
            Você pode consultar, mas precisa de uma assinatura ativa para alterar.
          </AvisoTexto>
          <AvisoBtn type="button" onClick={() => navigate(ROTA_ASSINATURA)}>
            Ver assinatura
          </AvisoBtn>
        </Aviso>
        {children}
      </>
    )
  }

  /**
   * Passou, mas com pagamento em atraso. A API tolera 7 dias, então a pessoa
   * age normalmente — o aviso existe para ela não descobrir só no dia em que a
   * tela fechar sozinha. Não bloqueia nada, de propósito.
   */
  const diasRestantes = diasDeToleranciaRestantes(sub ?? null)

  return (
    <>
      {diasRestantes !== null && (
        <Aviso role="status">
          <AlertTriangle size={16} />
          <AvisoTexto>
            Não conseguimos confirmar seu pagamento. Seu acesso continua por{' '}
            <strong>{diasRestantes === 1 ? 'mais 1 dia' : `mais ${diasRestantes} dias`}</strong>.
          </AvisoTexto>
          <AvisoBtn type="button" onClick={() => navigate(ROTA_ASSINATURA)}>
            Regularizar
          </AvisoBtn>
        </Aviso>
      )}
      {children}
    </>
  )
}
