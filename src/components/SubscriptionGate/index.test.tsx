/**
 * O portão tem três estados, e até a #174 só um tinha desenho.
 *
 * O que estes testes protegem é o que o desenho decidiu: carregando não libera
 * clique (era a origem do 402 que a #119 passou a devolver), atraso dentro da
 * tolerância avisa sem bloquear, e o texto não nomeia plano — porque o plano
 * saiu do código na #118 e vira uma grade na #112.
 */
import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import SubscriptionGate from './index'
import type { SubscriptionStatus } from '../../types/api'

const HORA_MS = 60 * 60 * 1000

function emHoras(horas: number): string {
  return new Date(Date.now() + horas * HORA_MS).toISOString()
}

const atrasadoHa = (horas: number): SubscriptionStatus => ({
  status: 'past_due',
  currentPeriodEnd: emHoras(-horas),
})

const conteudo = <button type="button">Criar quadra</button>

describe('SubscriptionGate — verificando', () => {
  it('não deixa clicar enquanto o status não chegou', () => {
    const { container } = renderWithProviders(
      <SubscriptionGate isActive={false} loading>{conteudo}</SubscriptionGate>,
    )

    expect(screen.getByText('Verificando assinatura…')).toBeInTheDocument()

    // O conteúdo continua visível — o usuário vê para onde está indo —, mas
    // inerte. Liberar o clique aqui é o que fazia a ação falhar com 402 depois
    // de o formulário já estar preenchido.
    const capa = container.querySelector('[style*="pointer-events: none"]')
    expect(capa).not.toBeNull()
    expect(capa).toContainElement(screen.getByRole('button', { name: 'Criar quadra' }))
  })
})

describe('SubscriptionGate — sem assinatura', () => {
  it('bloqueia e oferece o caminho da assinatura', () => {
    renderWithProviders(
      <SubscriptionGate isActive={false} loading={false}>{conteudo}</SubscriptionGate>,
    )

    expect(screen.getByText('Assinatura necessária')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver assinatura' })).toBeInTheDocument()
  })

  it('não nomeia plano nenhum no texto', () => {
    renderWithProviders(
      <SubscriptionGate isActive={false} loading={false}>{conteudo}</SubscriptionGate>,
    )

    // "Só+1 Pro" estava fixo no componente. O plano vem do banco desde a #118,
    // e com a grade da #112 deixa de ser um só.
    expect(screen.queryByText(/Só\+1 Pro/)).not.toBeInTheDocument()
  })
})

describe('SubscriptionGate — pagamento em atraso', () => {
  it('avisa sem bloquear quem está dentro da tolerância', () => {
    renderWithProviders(
      <SubscriptionGate isActive loading={false} sub={atrasadoHa(24)}>{conteudo}</SubscriptionGate>,
    )

    expect(screen.getByText(/Não conseguimos confirmar seu pagamento/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Regularizar' })).toBeInTheDocument()

    // O ponto do aviso: a ação continua disponível.
    expect(screen.getByRole('button', { name: 'Criar quadra' })).toBeEnabled()
    expect(screen.queryByText('Assinatura necessária')).not.toBeInTheDocument()
  })

  it('diz quantos dias ainda restam', () => {
    renderWithProviders(
      <SubscriptionGate isActive loading={false} sub={atrasadoHa(6 * 24)}>{conteudo}</SubscriptionGate>,
    )

    // Venceu há 6 dias, a janela é de 7 — resta 1.
    expect(screen.getByText('mais 1 dia')).toBeInTheDocument()
  })

  it('não avisa quem está em dia', () => {
    const emDia: SubscriptionStatus = { status: 'active', currentPeriodEnd: emHoras(24 * 20) }

    renderWithProviders(
      <SubscriptionGate isActive loading={false} sub={emDia}>{conteudo}</SubscriptionGate>,
    )

    expect(screen.queryByText(/Não conseguimos confirmar seu pagamento/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar quadra' })).toBeEnabled()
  })

  it('funciona sem receber a assinatura — o aviso é opcional', () => {
    renderWithProviders(
      <SubscriptionGate isActive loading={false}>{conteudo}</SubscriptionGate>,
    )

    expect(screen.getByRole('button', { name: 'Criar quadra' })).toBeEnabled()
    expect(screen.queryByText(/Não conseguimos confirmar/)).not.toBeInTheDocument()
  })
})
