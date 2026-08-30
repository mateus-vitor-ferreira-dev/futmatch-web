/**
 * Onde a pessoa dá aula, no perfil (web#377, api#451).
 *
 * O teste que carrega o arquivo é o de **sumir para quem não tem vínculo**.
 * Professor é papel de poucos, e um "você ainda não é professor de nenhum
 * espaço" no perfil de todo mundo anunciaria uma funcionalidade que ninguém
 * alcança sozinho — só o dono de um espaço a concede. Estado vazio é para o que
 * a pessoa pode preencher.
 *
 * O segundo é o de que o texto diga **papel por espaço**. É a coisa que a
 * api#451 existe para dizer, e é contraintuitiva: o resto do produto trata
 * papel como atributo da conta.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import { VinculosDeProfessor } from './index'

const auth = vi.hoisted(() => ({ estado: { user: null as unknown } }))
vi.mock('../../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))

const comVinculos = (professorEm: Array<{ id: string; name: string }>) => {
  auth.estado = { user: { id: 'eu', vinculos: { professorEm } } }
}

beforeEach(() => {
  auth.estado = { user: null }
})

describe('VinculosDeProfessor', () => {
  it('não aparece para quem não tem vínculo nenhum', () => {
    comVinculos([])

    const { container } = renderWithProviders(<VinculosDeProfessor />)

    expect(container).toBeEmptyDOMElement()
  })

  it('não aparece sem sessão, nem quebra quando o /auth/me não traz vinculos', () => {
    auth.estado = { user: { id: 'eu' } }

    const { container } = renderWithProviders(<VinculosDeProfessor />)

    expect(container).toBeEmptyDOMElement()
  })

  it('lista os espaços e diz que o papel vale só dentro deles', () => {
    comVinculos([
      { id: 'np', name: 'Na Praia FTV Lavras' },
      { id: 'sun', name: 'Sunset Arena Lavras' },
    ])

    renderWithProviders(<VinculosDeProfessor />)

    expect(screen.getByText('Na Praia FTV Lavras')).toBeInTheDocument()
    expect(screen.getByText('Sunset Arena Lavras')).toBeInTheDocument()
    // A frase concorda com o número: dois espaços, "destes espaços".
    expect(screen.getByText(/vale só dentro destes espaços/)).toBeInTheDocument()
  })

  it('com um espaço só, a frase concorda no singular', () => {
    comVinculos([{ id: 'ltc', name: 'Lavras Tênis Clube' }])

    renderWithProviders(<VinculosDeProfessor />)

    expect(screen.getByText(/vale só dentro deste espaço/)).toBeInTheDocument()
  })
})
