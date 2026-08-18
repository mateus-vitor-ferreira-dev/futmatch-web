import { useState, useEffect } from 'react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { CreditCard, Loader2, MapPin, Shield, CalendarCheck, Bell, BarChart3 } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { subscriptionService } from '../../../services/subscriptionService'
import { useSubscription } from '../../../hooks/useSubscription'
import { ownerService } from '../../../services/ownerService'
import { formatarPrecoCentavos } from '../../../utils/formatCurrency'
import { ROTULOS_DE_FUNCIONALIDADE, INCLUSO_EM_TODO_PLANO } from '../../../constants/planFeatures'
import { Container, Grid, Card, PlanHighlight, RowList, PrimaryButton, Badge, StatsGrid, StatCard, StatIcon, StatInfo, StatValue, StatLabel, ConviteEstatisticas } from './styles'
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
  const { temFuncionalidade } = useSubscription()

  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success')   toast.success('Pagamento realizado com sucesso!')
    if (payment === 'cancelled') toast.warning('Pagamento cancelado.')
  }, [searchParams])

  useEffect(() => {
    Promise.all([
      subscriptionService.getStatus().catch(() => ({ status: 'inactive', currentPeriodEnd: null })),
      // 403 quando o plano não abre estatísticas — cai no `null` e a grade abaixo
      // mostra o convite em vez dos números. O `catch` já engolia qualquer falha;
      // o que muda é a tela saber a diferença entre "não deu" e "não é do seu plano".
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
        {/* Estatística é funcionalidade de plano (api#278). Sem ela, no lugar dos
            números vai o convite — mostrar quatro traços deixaria o dono achando
            que o painel quebrou. */}
        {temFuncionalidade('ESTATISTICAS') ? (
        <StatsGrid>
          {[
            { icon: MapPin,       color: '#3b82f6', label: 'Estabelecimentos', value: stats?.totalPlaces  ?? '—' },
            { icon: Shield,       color: '#22c55e', label: 'Quadras',          value: stats?.totalCourts  ?? '—' },
            { icon: CalendarCheck,color: '#f59e0b', label: 'Partidas ativas',  value: stats?.activeEvents ?? '—' },
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
        ) : (
          <ConviteEstatisticas>
            <BarChart3 size={20} />
            <div>
              <strong>Estatísticas do espaço fazem parte de outro plano</strong>
              <p>Veja quantas partidas acontecem nas suas quadras, e quantas solicitações estão esperando.</p>
            </div>
            <PrimaryButton onClick={() => navigate('/owner/plans')}>Ver planos</PrimaryButton>
          </ConviteEstatisticas>
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
                  {/* Sem "de N": nenhum plano tem teto desde a api#278. O número
                      continua aqui porque é o tamanho do espaço, não uma cota. */}
                  <div className="row">
                    <span className="label">Quadras</span>
                    <span className="value">{sub?.usage?.quadras ?? 0} cadastradas</span>
                  </div>
                  <div className="row">
                    <span className="label">Estabelecimentos</span>
                    <span className="value">{sub?.usage?.estabelecimentos ?? 0} cadastrados</span>
                  </div>
                </RowList>
                <PrimaryButton onClick={() => navigate('/owner/plans')}>
                  <CreditCard size={16} /> {isActive ? 'Comparar ou trocar plano' : 'Ver planos e assinar'}
                </PrimaryButton>
              </>
            )}
          </Card>

          <Card>
            <h2>{sub?.plan ? 'O que seu plano abre' : 'Escolha seu plano'}</h2>
            {sub?.plan ? <RowList>
              {/* O que todo degrau inclui vem primeiro, e depois o que este abre.
                  Listar só as funcionalidades faria o Básico parecer um plano vazio,
                  quando ele é o de entrada — cadastrar a arena e receber partidas não
                  depende de funcionalidade nenhuma. */}
              {[
                ...INCLUSO_EM_TODO_PLANO,
                ...sub.plan.funcionalidades.map(f => ROTULOS_DE_FUNCIONALIDADE[f]),
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
