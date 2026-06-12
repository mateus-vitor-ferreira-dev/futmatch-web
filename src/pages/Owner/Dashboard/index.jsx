import { useState, useEffect } from 'react'
import { LayoutDashboard, ClipboardList, Building2, Home } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import api from '../../../services/api'
import DashboardLayout from '../../../components/DashboardLayout'
import { Container, Grid, Card, PlanHighlight, RowList, PrimaryButton, Badge } from './styles'

// Navegação exata do Owner
const OWNER_NAV_ITEMS = [
  { to: '/owner',          label: 'Visão Geral',        icon: LayoutDashboard, end: true },
  { to: '/owner/requests', label: 'Solicitações',       icon: ClipboardList   },
  { to: '/owner/places',   label: 'Estabelecimentos',   icon: Building2       },
  { to: '/home',           label: 'Área do Jogador',    icon: Home, divider: true },
]

export default function OwnerDashboard() {
  const { user } = useAuth()
  const [sub, setSub] = useState(null)
  const [payments, setPayments] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const [subRes, payRes] = await Promise.all([
        api.get('/owner/subscription').catch(() => ({ data: { plan: 'Básico', value: '150,00', status: 'Ativo', nextDue: '2026-06-10', contract: '#CTR-089' } })),
        api.get('/owner/payments').catch(() => ({ data: [] }))
      ])
      setSub(subRes.data || subRes)
      setPayments(payRes.data || payRes)
    }
    fetchData()
  }, [])

  return (
    <DashboardLayout
      user={user}
      navItems={OWNER_NAV_ITEMS}
      tagline="Owner Panel"
      accent="#3b82f6"
      pageTitle="Minha Assinatura"
      pageSub="Verifique o status do seu contrato e seus pagamentos mensais ao Só+1."
    >
      <Container>
        <Grid>
          <Card>
            <h2>Seu Plano Atual</h2>
            <PlanHighlight>
              <div className="header">
                <h3>Plano {sub?.plan || 'Básico'}</h3>
                <Badge $status={sub?.status || 'Ativo'}>{sub?.status || 'Ativo'}</Badge>
              </div>
              <div className="price">R$ {sub?.value || '150,00'} / mês</div>
            </PlanHighlight>
            <RowList>
              <div className="row"><span className="label">Data de Contratação</span><span className="value">01/01/2026</span></div>
              <div className="row"><span className="label">Contrato</span><span className="value">{sub?.contract || '#CTR-2026-089'}</span></div>
              <div className="row"><span className="label">Próximo Vencimento</span><span className="value" style={{color: '#ef4444'}}>{new Date(sub?.nextDue || '2026-06-10').toLocaleDateString('pt-BR')}</span></div>
            </RowList>
            <PrimaryButton>Pagar Mensalidade</PrimaryButton>
          </Card>

          <Card>
            <h2>Histórico de Mensalidades</h2>
            <RowList>
              {payments.map((p, i) => (
                <div className="row" key={i}>
                  <div>
                    <div className="value">R$ {p.amount}</div>
                    <div className="label">{new Date(p.date).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <Badge $status={p.status}>{p.status}</Badge>
                </div>
              ))}
              {payments.length === 0 && <span className="label">Nenhum pagamento registrado.</span>}
            </RowList>
          </Card>
        </Grid>
      </Container>
    </DashboardLayout>
  )
}