import { useState, useEffect } from 'react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { CreditCard, Loader2, MapPin, Shield, CalendarCheck, Bell } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { subscriptionService } from '../../../services/subscriptionService'
import { ownerService } from '../../../services/ownerService'
import { formatarPrecoCentavos } from '../../../utils/formatCurrency'
import { Container, Grid, Card, PlanHighlight, RowList, PrimaryButton, Badge, StatsGrid, StatCard, StatIcon, StatInfo, StatValue, StatLabel } from './styles'
import type { OwnerStats, SubscriptionStatus } from '../../../types/api'

const STATUS_LABEL: Record<string, string> = {
  active:    'Ativo',
  trialing:  'Trial',
  past_due:  'Vencida',
  canceled:  'Cancelada',
  inactive:  'Inativo',
}

export default function OwnerDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [sub, setSub] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<OwnerStats | null>(null)

  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success')   toast.success('Pagamento realizado com sucesso!')
    if (payment === 'cancelled') toast.warning('Pagamento cancelado.')
  }, [searchParams])

  useEffect(() => {
    Promise.all([
      subscriptionService.getStatus().catch(() => ({ status: 'inactive', currentPeriodEnd: null })),
      ownerService.getStats().catch(() => null),
    ]).then(([subData, statsData]) => {
      setSub(subData)
      setStats(statsData)
    }).finally(() => setLoading(false))
  }, [])

  const isActive = sub?.status === 'active' || sub?.status === 'trialing'
  const nomePlano = sub?.plan?.nome ?? 'Nenhum plano ativo'

  usePageHeader("Minha Assinatura", "Acompanhe seu uso e gerencie sua assinatura.")

  return (
    <>
      <Container>
        <StatsGrid>
          {[
            { icon: MapPin,       color: '#3b82f6', label: 'Estabelecimentos', value: stats?.totalPlaces  ?? '—' },
            { icon: Shield,       color: '#22c55e', label: 'Quadras',          value: stats?.totalCourts  ?? '—' },
            { icon: CalendarCheck,color: '#f59e0b', label: 'Peladas ativas',   value: stats?.activeEvents ?? '—' },
            { icon: Bell,         color: '#ef4444', label: 'Solicitações pendentes', value: stats?.pendingRequests ?? '—' },
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
                    <h3>{nomePlano}</h3>
                    <Badge $status={sub?.status || 'inactive'}>
                      {(sub?.status && STATUS_LABEL[sub.status]) || 'Inativo'}
                    </Badge>
                  </div>
                  {sub?.plan && (
                    <div className="price">{formatarPrecoCentavos(sub.plan.precoCentavos)} / mês</div>
                  )}
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
                    <span className="label">Quadras</span>
                    <span className="value">
                      {sub?.plan
                        ? `${sub.usage?.quadras ?? 0} de ${sub.plan.maxQuadras ?? 'ilimitadas'}`
                        : `${sub?.usage?.quadras ?? 0} cadastradas`}
                    </span>
                  </div>
                  <div className="row">
                    <span className="label">Estabelecimentos</span>
                    <span className="value">
                      {sub?.plan
                        ? `${sub.usage?.estabelecimentos ?? 0} de ${sub.plan.maxEstabelecimentos ?? 'ilimitados'}`
                        : `${sub?.usage?.estabelecimentos ?? 0} cadastrados`}
                    </span>
                  </div>
                </RowList>
                <PrimaryButton onClick={() => navigate('/owner/plans')}>
                  <CreditCard size={16} /> {isActive ? 'Comparar ou trocar plano' : 'Ver planos e assinar'}
                </PrimaryButton>
              </>
            )}
          </Card>

          <Card>
            <h2>{sub?.plan ? 'Limites do plano' : 'Escolha seu plano'}</h2>
            {sub?.plan ? <RowList>
              {[
                `${sub.plan.maxQuadras ?? 'Ilimitadas'} quadras`,
                `${sub.plan.maxEstabelecimentos ?? 'Ilimitados'} estabelecimentos`,
                `${sub.plan.maxModalidades ?? 'Ilimitadas'} modalidades`,
              ].map(item => (
                <div className="row" key={item}>
                  <span style={{ color: '#3BAA34', fontWeight: 600 }}>✓</span>
                  <span className="value">{item}</span>
                </div>
              ))}
            </RowList> : <p>Compare preços e limites para escolher o plano que acompanha o seu negócio.</p>}
          </Card>
        </Grid>
      </Container>
    </>
  )
}
