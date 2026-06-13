import { useState, useEffect } from 'react'
import { LayoutDashboard, ClipboardList, Building2, Home, CreditCard, Loader2, MapPin, Shield, CalendarCheck, Bell } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../../contexts/AuthContext'
import { subscriptionService } from '../../../services/subscriptionService'
import { ownerService } from '../../../services/ownerService'
import DashboardLayout from '../../../components/DashboardLayout'
import { Container, Grid, Card, PlanHighlight, RowList, PrimaryButton, Badge, StatsGrid, StatCard, StatIcon, StatInfo, StatValue, StatLabel } from './styles'

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
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success')   toast.success('Pagamento realizado com sucesso!')
    if (payment === 'cancelled') toast.warning('Pagamento cancelado.')
  }, [searchParams])

  useEffect(() => {
    Promise.all([
      subscriptionService.getStatus().catch(() => ({ status: 'inactive' })),
      ownerService.getStats().catch(() => null),
    ]).then(([subData, statsData]) => {
      setSub(subData)
      setStats(statsData)
    }).finally(() => setLoading(false))
  }, [])

  const handlePay = async () => {
    try {
      setPaying(true)
      const { url } = await subscriptionService.createCheckout()
      window.location.href = url
    } catch {
      toast.error('Erro ao iniciar pagamento. Tente novamente.')
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
        <StatsGrid>
          {[
            { icon: MapPin,       color: '#3b82f6', label: 'Estabelecimentos', value: stats?.totalPlaces  ?? '—' },
            { icon: Shield,       color: '#22c55e', label: 'Quadras',          value: stats?.totalCourts  ?? '—' },
            { icon: CalendarCheck,color: '#f59e0b', label: 'Peladas ativas',   value: stats?.activeEvents ?? '—' },
            { icon: Bell,         color: '#ef4444', label: 'Sol. pendentes',   value: stats?.pendingRequests ?? '—' },
          ].map(({ icon: Icon, color, label, value }) => (
            <StatCard key={label}>
              <StatIcon $color={color}><Icon size={20} /></StatIcon>
              <StatInfo>
                <StatValue>{loading ? '—' : value}</StatValue>
                <StatLabel>{label}</StatLabel>
              </StatInfo>
            </StatCard>
          ))}
        </StatsGrid>

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
