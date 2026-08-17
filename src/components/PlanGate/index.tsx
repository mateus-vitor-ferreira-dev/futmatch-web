import type { ReactNode } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSubscription } from '../../hooks/useSubscription'
import { ROTULOS_DE_FUNCIONALIDADE } from '../../constants/planFeatures'
import type { PlanFeature } from '../../types/api'
import { Tela, Box, Icon, Title, Desc, Btn, Carregando } from './styles'

/** Onde o dono troca de plano. */
const ROTA_PLANOS = '/owner/plans'

export interface PlanGateProps {
  funcionalidade: PlanFeature
  children: ReactNode
}

/**
 * Barra o que o plano assinado não abre.
 *
 * **Não é o `SubscriptionGate`, e a diferença importa.** Aquele responde "sua
 * assinatura não está em dia" e manda regularizar o pagamento; este responde "seu
 * plano não inclui isso" e manda trocar de degrau. Quem está em dia no Básico não
 * resolve nada pagando a fatura — e mandá-lo para a tela de pagamento seria o
 * conselho errado, dado com toda a confiança. A API faz a mesma distinção entre
 * `requireActiveSubscription` (402) e `requireFuncionalidade` (403).
 *
 * Ao contrário do `SubscriptionGate`, aqui o conteúdo **não** aparece esmaecido por
 * trás: não é uma tela do dono que está temporariamente travada, é uma tela que não
 * faz parte do que ele contratou. Mostrá-la desbotada venderia por espiada o que a
 * tela de planos vende direito.
 */
export default function PlanGate({ funcionalidade, children }: PlanGateProps) {
  const navigate = useNavigate()
  const { temFuncionalidade, loading } = useSubscription()

  if (loading) {
    return (
      <Tela>
        <Carregando role="status">
          <Loader2 size={16} />
          Verificando seu plano…
        </Carregando>
      </Tela>
    )
  }

  if (!temFuncionalidade(funcionalidade)) {
    const rotulo = ROTULOS_DE_FUNCIONALIDADE[funcionalidade]
    return (
      <Tela>
        <Box>
          <Icon><Lock size={30} /></Icon>
          <Title>{rotulo} faz parte de outro plano</Title>
          {/* Sem nome de plano no texto: a grade vem do banco, e cópia que nomeia
              degrau envelhece no primeiro reajuste. A tela de planos diz qual é. */}
          <Desc>
            Seu plano atual não inclui esta parte do painel. Veja o que muda de um plano
            para o outro e troque quando quiser.
          </Desc>
          <Btn onClick={() => navigate(ROTA_PLANOS)}>Ver planos</Btn>
        </Box>
      </Tela>
    )
  }

  return <>{children}</>
}
