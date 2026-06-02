import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, ClipboardList, Building2, Home } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import api from '../../../services/api'
import DashboardLayout from '../../../components/DashboardLayout'
import { Container, KpiGrid, KpiCard, Section, Table, Badge, ActionButton } from './styles'

// Navegação exata do Admin
const NAV_ITEMS = [
  { to: '/admin',          label: 'Visão Geral',        icon: LayoutDashboard },
  { to: '/admin/users',    label: 'Gestão de Usuários', icon: Users           },
  { to: '/admin/requests', label: 'Solicitações',       icon: ClipboardList   },
  { to: '/admin/places',   label: 'Estabelecimentos',   icon: Building2       },
  { to: '/home',           label: 'Área do Jogador',    icon: Home, divider: true },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ totalArenas: 0, active: 0, revenue: 0, expiring: 0 })
  const [contracts, setContracts] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [statsRes, contractsRes, paymentsRes] = await Promise.all([
          api.get('/admin/stats').catch(() => ({ data: { totalArenas: 0, active: 0, revenue: '0,00', expiring: 0 } })),
          api.get('/admin/subscriptions').catch(() => ({ data: [] })),
          api.get('/admin/payments').catch(() => ({ data: [] }))
        ])
        setStats(statsRes.data || statsRes)
        setContracts(contractsRes.data || [])
        setPayments(paymentsRes.data || [])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <DashboardLayout
      user={user}
      navItems={NAV_ITEMS}
      tagline="Admin Panel"
      accent="#16a34a"
      pageTitle="Visão Geral (Assinaturas)"
      pageSub="Acompanhe contratos, pagamentos e a saúde financeira da plataforma"
    >
      <Container>
        <KpiGrid>
          <KpiCard $borderColor="#3b82f6"><h3>Total de Arenas</h3><p>{stats.totalArenas}</p></KpiCard>
          <KpiCard $borderColor="#22c55e"><h3>Assinaturas Ativas</h3><p>{stats.active}</p></KpiCard>
          <KpiCard $borderColor="#f97316"><h3>Receita Mensal</h3><p>R$ {stats.revenue}</p></KpiCard>
          <KpiCard $borderColor="#ef4444"><h3>Vencendo</h3><p>{stats.expiring}</p></KpiCard>
        </KpiGrid>

        <Section>
          <h2>Contratos Ativos e Pendentes</h2>
          <Table>
            <thead>
              <tr>
                <th>Arena</th>
                <th>Proprietário</th>
                <th>Plano</th>
                <th>Valor Mensal</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(contract => (
                <tr key={contract.id}>
                  <td><strong>{contract.place?.name}</strong></td>
                  <td>{contract.owner?.name}</td>
                  <td>{contract.planName || 'Básico'}</td>
                  <td>R$ {contract.monthlyValue}</td>
                  <td><Badge $status={contract.status === 'OPEN' ? 'Ativo' : 'Pendente'}>{contract.status === 'OPEN' ? 'Ativo' : 'Pendente'}</Badge></td>
                  <td><ActionButton>Ver Detalhes</ActionButton></td>
                </tr>
              ))}
              {contracts.length === 0 && !loading && <tr><td colSpan="6" style={{textAlign:'center'}}>Nenhum contrato encontrado.</td></tr>}
            </tbody>
          </Table>
        </Section>

        <Section>
          <h2>Últimos Pagamentos Recebidos</h2>
          <Table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Arena</th>
                <th>Valor</th>
                <th>Método</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td>{new Date(payment.date).toLocaleDateString('pt-BR')}</td>
                  <td>{payment.place?.name}</td>
                  <td>R$ {payment.amount}</td>
                  <td>{payment.method}</td>
                  <td><Badge $status={payment.status}>{payment.status}</Badge></td>
                </tr>
              ))}
              {payments.length === 0 && !loading && <tr><td colSpan="5" style={{textAlign:'center'}}>Nenhum pagamento registrado.</td></tr>}
            </tbody>
          </Table>
        </Section>
      </Container>
    </DashboardLayout>
  )
}