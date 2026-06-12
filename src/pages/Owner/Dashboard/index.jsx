import { useState, useEffect } from 'react'
import { LayoutDashboard, ClipboardList, Building2, Home, CreditCard, Loader2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { subscriptionService } from '../../../services/subscriptionService'
import DashboardLayout from '../../../components/DashboardLayout'
import { Container, Grid, Card, PlanHighlight, RowList, PrimaryButton, Badge } from './styles'

const OWNER_NAV_ITEMS = [
  { to: '/owner',          label: 'Visão Geral',      icon: LayoutDashboard, end: true },
  { to: '/owner/requests', label: 'Solicitações',     icon: ClipboardList   },
  { to: '/owner/places',   label: 'Estabelecimentos', icon: Building2       },
  { to: '/home',           label: 'Área do Jogador',  icon: Home, divider: true },
]

const STATUS_LABEL = {
  active:    'Ativo',
  trialing:  'Trial',
  past_due:  'Vencida',
  canceled:  'Cancelada',
  inactive:  'Inativo',
}

export default function OwnerDashboard() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success')   setFeedback({ type: 'success', msg: 'Pagamento realizado com sucesso!' })
    if (payment === 'cancelled') setFeedback({ type: 'warn',    msg: 'Pagamento cancelado.' })
  }, [searchParams])

  useEffect(() => {
    subscriptionService.getStatus()
      .then(data => setSub(data))
      .catch(() => setSub({ status: 'inactive' }))
      .finally(() => setLoading(false))
  }, [])

  const handlePay = async () => {
    try {
      setPaying(true)
      const { url } = await subscriptionService.createCheckout()
      window.location.href = url
    } catch {
      setFeedback({ type: 'error', msg: 'Erro ao iniciar pagamento. Tente novamente.' })
      setPaying(false)
    }
  }

  const isActive = sub?.status === 'active' || sub?.status === 'trialing'

  return (
    <DashboardLayout
      user={user}
      navItems={OWNER_NAV_ITEMS}
      tagline="Owner Panel"
      accent="#3b82f6"
      pageTitle="Minha Assinatura"
      pageSub="Gerencie sua assinatura Só+1 Pro."
    >
      <Container>
        {feedback && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 16,
            background: feedback.type === 'success' ? '#dcfce7' : feedback.type === 'warn' ? '#fef9c3' : '#fee2e2',
            color: feedback.type === 'success' ? '#166534' : feedback.type === 'warn' ? '#854d0e' : '#991b1b',
          }}>
            {feedback.msg}
          </div>
        )}

        <Grid>
          <Card>
            <h2>Seu Plano Atual</h2>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <>
                <PlanHighlight>
                  <div className="header">
                    <h3>Só+1 Pro</h3>
                    <Badge $status={sub?.status || 'inactive'}>
                      {STATUS_LABEL[sub?.status] || 'Inativo'}
                    </Badge>
                  </div>
                  <div className="price">R$ 79,90 / mês</div>
                </PlanHighlight>
                <RowList>
                  {sub?.currentPeriodEnd && (
                    <div className="row">
                      <span className="label">Próximo Vencimento</span>
                      <span className="value" style={{ color: isActive ? undefined : '#ef4444' }}>
                        {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  <div className="row">
                    <span className="label">Métodos aceitos</span>
                    <span className="value">Cartão · Boleto</span>
                  </div>
                </RowList>
                <PrimaryButton onClick={handlePay} disabled={paying}>
                  {paying
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Aguarde...</>
                    : <><CreditCard size={16} /> {isActive ? 'Gerenciar Assinatura' : 'Assinar Só+1 Pro'}</>
                  }
                </PrimaryButton>
              </>
            )}
          </Card>

          <Card>
            <h2>Incluso no plano</h2>
            <RowList>
              {[
                'Quadras ilimitadas',
                'Peladas ilimitadas',
                'Painel de gestão completo',
                'Histórico de eventos',
                'Suporte por e-mail',
              ].map(item => (
                <div className="row" key={item}>
                  <span style={{ color: '#3BAA34', fontWeight: 600 }}>✓</span>
                  <span className="value">{item}</span>
                </div>
              ))}
            </RowList>
          </Card>
        </Grid>
      </Container>
    </DashboardLayout>
  )
}
