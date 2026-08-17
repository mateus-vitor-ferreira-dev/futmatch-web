/**
 * O portão que separa "seu plano não inclui" de "sua assinatura não está em dia".
 *
 * A distinção não é cosmética: quem está em dia no Básico não resolve nada pagando a
 * fatura — precisa subir de degrau. Mandar essa pessoa para a tela de pagamento seria
 * o conselho errado, dado com toda a confiança. A API faz a mesma separação entre
 * `requireActiveSubscription` (402) e `requireFuncionalidade` (403).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import PlanGate from './index'

const assinatura = vi.hoisted(() => ({
  estado: { loading: false, temFuncionalidade: () => true } as {
    loading: boolean
    temFuncionalidade: (funcionalidade: string) => boolean
  },
}))

vi.mock('../../hooks/useSubscription', () => ({
  useSubscription: () => assinatura.estado,
}))

const navegar = vi.fn()
vi.mock('react-router-dom', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useNavigate: () => navegar,
}))

beforeEach(() => {
  vi.clearAllMocks()
  assinatura.estado = { loading: false, temFuncionalidade: () => true }
})

describe('PlanGate — plano abre', () => {
  it('deixa a página passar inteira', () => {
    renderWithProviders(<PlanGate funcionalidade="ESTOQUE"><p>lista de produtos</p></PlanGate>)

    expect(screen.getByText('lista de produtos')).toBeInTheDocument()
  })
})

describe('PlanGate — plano não abre', () => {
  beforeEach(() => {
    assinatura.estado = { loading: false, temFuncionalidade: () => false }
  })

  it('esconde o conteúdo por completo, e não apenas esmaecido', () => {
    renderWithProviders(<PlanGate funcionalidade="ESTOQUE"><p>lista de produtos</p></PlanGate>)

    // Diferente do SubscriptionGate, que mostra a tela do dono desbotada por trás:
    // esta tela não é dele, e espiá-la venderia de graça o que a tela de planos vende.
    expect(screen.queryByText('lista de produtos')).not.toBeInTheDocument()
  })

  it('nomeia a funcionalidade, para o dono saber o que está comprando', () => {
    renderWithProviders(<PlanGate funcionalidade="EQUIPAMENTOS"><p>oculto</p></PlanGate>)

    expect(screen.getByText(/controle de equipamento/i)).toBeInTheDocument()
  })

  it('manda para os planos, não para o pagamento', async () => {
    const { user } = renderWithProviders(<PlanGate funcionalidade="ESTOQUE"><p>oculto</p></PlanGate>)

    await user.click(screen.getByRole('button', { name: 'Ver planos' }))

    await waitFor(() => expect(navegar).toHaveBeenCalledWith('/owner/plans'))
  })

  it('não nomeia degrau nenhum no texto', () => {
    renderWithProviders(<PlanGate funcionalidade="ESTOQUE"><p>oculto</p></PlanGate>)

    // A grade vem do banco: cópia que diz "assine o Premium" envelhece no primeiro
    // reajuste, e a tela de planos é quem sabe o nome certo.
    expect(document.body).not.toHaveTextContent(/premium|pro\b|b[áa]sico/i)
  })
})

describe('PlanGate — verificando', () => {
  it('não mostra o conteúdo enquanto o plano não chegou', () => {
    assinatura.estado = { loading: true, temFuncionalidade: () => true }

    renderWithProviders(<PlanGate funcionalidade="ESTOQUE"><p>lista de produtos</p></PlanGate>)

    // Mostrar e retirar meio segundo depois é pior do que segurar por um instante.
    expect(screen.queryByText('lista de produtos')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/verificando seu plano/i)
  })
})
