import type { ReactNode } from 'react'
import { CreditCard, Loader2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { diasDeToleranciaRestantes } from '../../hooks/useSubscription'
import type { SubscriptionStatus } from '../../types/api'
import { Overlay, Box, Icon, Title, Desc, Btn, Aviso, AvisoTexto, AvisoBtn, Carregando } from './styles'

/** Onde o dono assina ou gerencia a assinatura. */
const ROTA_ASSINATURA = '/owner/plans'

export interface SubscriptionGateProps {
  isActive: boolean
  loading: boolean
  /**
   * Assinatura crua, só para o aviso de atraso. Opcional: sem ela o portão
   * continua funcionando, apenas sem avisar quem está em `past_due`.
   */
  sub?: SubscriptionStatus | null
  children: ReactNode
}

export default function SubscriptionGate({ isActive, loading, sub, children }: SubscriptionGateProps) {
  const navigate = useNavigate()

  /**
   * Enquanto carrega, a tela aparece mas **não é clicável**.
   *
   * Antes era liberada inteira (`if (loading) return children`), e essa linha
   * era a origem do beco que a #119 fechou no servidor: o dono clicava em
   * "criar quadra" antes de o status chegar, preenchia o formulário e levava um
   * 402 no fim. Prometer o que ainda pode ser negado é o que cria o problema —
   * segurar por um instante não custa nada.
   */
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
      <div style={{ position: 'relative' }}>
        <div style={{ opacity: 0.25, pointerEvents: 'none', userSelect: 'none' }}>
          {children}
        </div>
        <Overlay>
          <Box>
            <Icon><CreditCard size={32} /></Icon>
            <Title>Assinatura necessária</Title>
            {/* Sem nome de plano no texto: ele vem do banco desde a #118 e vira
                uma grade na #112. Cópia que nomeia plano envelhece no deploy. */}
            <Desc>Ative sua assinatura para acessar este recurso.</Desc>
            <Btn onClick={() => navigate(ROTA_ASSINATURA)}>Ver assinatura</Btn>
          </Box>
        </Overlay>
      </div>
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
