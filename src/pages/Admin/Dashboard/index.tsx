import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, ClipboardList, Building2, Home, Store } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import api from '../../../services/api'
import DashboardLayout from '../../../components/DashboardLayout'
import {
  Container, KpiGrid, KpiCard, Section, Table, Badge, ActionButton,
  DetailModal, DetailOverlay, DetailBox, DetailHeader, DetailTitle, CloseBtn,
  DetailRow, DetailLabel, DetailValue,
} from './styles'

// Navegação exata do Admin
const NAV_ITEMS = [
  { to: '/admin',          label: 'Visão Geral',        icon: LayoutDashboard, end: true },
  { to: '/admin/users',    label: 'Gestão de Usuários', icon: Users           },
  { to: '/admin/requests', label: 'Solicitações',       icon: ClipboardList   },
  { to: '/admin/places',   label: 'Estabelecimentos',   icon: Building2       },
  { to: '/owner',          label: 'Painel do Owner',    icon: Store, divider: true },
  { to: '/home',           label: 'Área do Jogador',    icon: Home },
]

const STATUS_LABEL: Record<string, string> = { active: 'Ativo', trialing: 'Trial', past_due: 'Vencida', canceled: 'Cancelada', inactive: 'Inativo' }
const STATUS_COLOR: Record<string, string> = { active: '#15803d', trialing: '#1d4ed8', past_due: '#dc2626', canceled: '#6b7280', inactive: '#6b7280' }
const STATUS_BG: Record<string, string> = { active: '#dcfce7', trialing: '#dbeafe', past_due: '#fee2e2', canceled: '#f3f4f6', inactive: '#f3f4f6' }

/** Contrato como o /admin/subscriptions o devolve (ver admin.service.listSubscriptions). */
interface Contract {
  id: string
  owner: { name: string; email: string }
  place: { name: string } | null
  planName: string
  monthlyValue: string
  status: string
  currentPeriodEnd: string | null
}

/**
 * ⚠️ Forma que a tabela de pagamentos espera. O endpoint /admin/payments é um
 * stub no backend (admin.controller.listPayments devolve sempre []), então
 * nada produz estes campos hoje — a tabela nunca renderiza uma linha.
 * Declarado para documentar o contrato pretendido.
 */
interface Payment {
  id: string
  date: string
  place: { name: string } | null
  amount: string | number
  method: string
  status: string
}

interface DashboardStats {
  totalArenas: number
  active: number
  /** String formatada ("79,90"), não número — é o que a API devolve. */
  revenue: string
  expiring: number
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({ totalArenas: 0, active: 0, revenue: '0,00', expiring: 0 })
  const [contracts, setContracts] = useState<Contract[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [detailContract, setDetailContract] = useState<Contract | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [statsRes, contractsRes, paymentsRes] = await Promise.all([
          api.get('/admin/stats').catch(() => ({ data: { totalArenas: 0, active: 0, revenue: '0,00', expiring: 0 } })),
          api.get('/admin/subscriptions').catch(() => ({ data: [] })),
          api.get('/admin/payments').catch(() => ({ data: [] }))
        ])
        // O `?? statsRes.data` cobre o fallback do .catch acima, que devolve o
        // objeto cru em vez do envelope { success, data } da API.
        setStats((statsRes.data?.data ?? statsRes.data) as DashboardStats)
        setContracts((contractsRes.data?.data ?? contractsRes.data ?? []) as Contract[])
        setPayments((paymentsRes.data?.data ?? paymentsRes.data ?? []) as Payment[])
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
              {contracts.map((contract: Contract) => (
                <tr key={contract.id}>
                  <td><strong>{contract.place?.name}</strong></td>
                  <td>{contract.owner?.name}</td>
                  <td>{contract.planName || 'Básico'}</td>
                  <td>R$ {contract.monthlyValue}</td>
                  <td><Badge $status={contract.status === 'active' || contract.status === 'trialing' ? 'Ativo' : 'Pendente'}>{STATUS_LABEL[contract.status] ?? contract.status}</Badge></td>
                  <td><ActionButton onClick={() => setDetailContract(contract)}>Ver Detalhes</ActionButton></td>
                </tr>
              ))}
              {contracts.length === 0 && !loading && <tr><td colSpan={6} style={{textAlign:'center'}}>Nenhum contrato encontrado.</td></tr>}
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
              {payments.map((payment: Payment) => (
                <tr key={payment.id}>
                  <td>{new Date(payment.date).toLocaleDateString('pt-BR')}</td>
                  <td>{payment.place?.name}</td>
                  <td>R$ {payment.amount}</td>
                  <td>{payment.method}</td>
                  <td><Badge $status={payment.status}>{payment.status}</Badge></td>
                </tr>
              ))}
              {payments.length === 0 && !loading && <tr><td colSpan={5} style={{textAlign:'center'}}>Nenhum pagamento registrado.</td></tr>}
            </tbody>
          </Table>
        </Section>
      </Container>

      {detailContract && (
        <DetailModal>
          <DetailOverlay onClick={() => setDetailContract(null)} />
          <DetailBox>
            <DetailHeader>
              <DetailTitle>Detalhes do Contrato</DetailTitle>
              <CloseBtn onClick={() => setDetailContract(null)}>✕</CloseBtn>
            </DetailHeader>

            <DetailRow>
              <DetailLabel>Proprietário</DetailLabel>
              <DetailValue>{detailContract.owner?.name ?? '—'}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>E-mail</DetailLabel>
              <DetailValue>{detailContract.owner?.email ?? '—'}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Estabelecimento</DetailLabel>
              <DetailValue>{detailContract.place?.name ?? 'Não vinculado'}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Plano</DetailLabel>
              <DetailValue>{detailContract.planName ?? 'Só+1 Pro'}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Valor Mensal</DetailLabel>
              <DetailValue>R$ {detailContract.monthlyValue}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Status</DetailLabel>
              <DetailValue>
                <span style={{
                  padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                  background: STATUS_BG[detailContract.status] ?? '#f3f4f6',
                  color: STATUS_COLOR[detailContract.status] ?? '#6b7280',
                }}>
                  {STATUS_LABEL[detailContract.status] ?? detailContract.status}
                </span>
              </DetailValue>
            </DetailRow>
            {detailContract.currentPeriodEnd && (
              <DetailRow>
                <DetailLabel>Vencimento</DetailLabel>
                <DetailValue>{new Date(detailContract.currentPeriodEnd).toLocaleDateString('pt-BR')}</DetailValue>
              </DetailRow>
            )}
          </DetailBox>
        </DetailModal>
      )}
    </DashboardLayout>
  )
}