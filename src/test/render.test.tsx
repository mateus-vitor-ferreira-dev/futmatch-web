/**
 * Teste do próprio helper.
 *
 * A fundação de teste também é código, e um helper quebrado falha de um jeito
 * péssimo: o erro aparece no teste de quem só estava usando ele, apontando
 * para o componente errado.
 */
import { describe, it, expect } from 'vitest'
import { useParams, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { renderWithProviders, screen } from './render'

function MostraParametro() {
  const { eventId } = useParams()
  const { pathname } = useLocation()
  return <p>pelada {eventId} em {pathname}</p>
}

const Pintado = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
`

function UsaTema() {
  return <Pintado>com tema</Pintado>
}

describe('renderWithProviders', () => {
  it('entrega os providers para um componente que usa tema', () => {
    renderWithProviders(<UsaTema />)
    expect(screen.getByText('com tema')).toBeInTheDocument()
  })

  it('posiciona o componente na rota pedida', () => {
    renderWithProviders(<MostraParametro />, { route: '/partida/42' })
    expect(screen.getByText(/em \/partida\/42/)).toBeInTheDocument()
  })

  it('preenche useParams quando o padrão da rota é informado', () => {
    renderWithProviders(<MostraParametro />, {
      route: '/partida/42',
      path: '/partida/:eventId',
    })
    expect(screen.getByText(/pelada 42/)).toBeInTheDocument()
  })

  it('aplica o tema escuro quando pedido', () => {
    const { unmount } = renderWithProviders(<UsaTema />, { theme: 'dark' })
    const escuro = window.getComputedStyle(screen.getByText('com tema')).color
    unmount()

    renderWithProviders(<UsaTema />, { theme: 'light' })
    const claro = window.getComputedStyle(screen.getByText('com tema')).color

    expect(escuro).not.toBe(claro)
  })
})
