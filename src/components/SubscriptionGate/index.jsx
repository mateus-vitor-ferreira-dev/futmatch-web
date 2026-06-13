import { CreditCard, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Overlay, Box, Icon, Title, Desc, Btn } from './styles'

export default function SubscriptionGate({ isActive, loading, children }) {
  const navigate = useNavigate()

  if (loading) return children

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
            <Desc>Assine o Só+1 Pro para acessar este recurso.</Desc>
            <Btn onClick={() => navigate('/owner/dashboard')}>
              <Loader2 size={16} style={{ display: 'none' }} />
              Assinar Só+1 Pro
            </Btn>
          </Box>
        </Overlay>
      </div>
    )
  }

  return children
}
