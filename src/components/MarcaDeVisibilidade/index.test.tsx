/**
 * A marca de partida não listada (#227).
 *
 * O teste que importa é o do silêncio: partida pública não ganha marca. Carimbar
 * "pública" na esmagadora maioria transformaria o normal em aviso, e o aviso em
 * ruído — a marca existe porque `LINK` e `PRIVATE` são a exceção.
 */
import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import { MarcaDeVisibilidade } from './index'

describe('MarcaDeVisibilidade', () => {
  it('não marca a partida pública', () => {
    const { container } = renderWithProviders(<MarcaDeVisibilidade visibility="PUBLIC" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('não marca quando a API não disse a visibilidade', () => {
    // Partida antiga, de antes do campo. Inventar "privada" aqui assustaria o
    // organizador com uma restrição que a partida não tem.
    const { container } = renderWithProviders(<MarcaDeVisibilidade />)

    expect(container).toBeEmptyDOMElement()
  })

  it('marca a partida por link, e explica o que isso significa', () => {
    renderWithProviders(<MarcaDeVisibilidade visibility="LINK" />)

    expect(screen.getByText('Por link')).toBeInTheDocument()
    // "Por link" sozinho não diz do que se trata para quem usa leitor de tela.
    expect(screen.getByLabelText(/Visibilidade: Por link/)).toHaveAttribute(
      'title',
      'Fora da busca. Quem tem o endereço abre e entra.',
    )
  })

  it('marca a partida privada', () => {
    renderWithProviders(<MarcaDeVisibilidade visibility="PRIVATE" />)

    expect(screen.getByText('Privada')).toBeInTheDocument()
    expect(screen.getByLabelText(/Visibilidade: Privada/)).toHaveAttribute(
      'title',
      'Fora da busca, e o endereço sozinho não abre.',
    )
  })
})
