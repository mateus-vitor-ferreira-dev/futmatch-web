/**
 * Exemplo de teste de componente — este é o padrão que o time segue.
 *
 * Repare no que ele NÃO faz: não importa `Badge` de `./styles`, não checa
 * nome de classe gerada pelo styled-components e não inspeciona estado
 * interno. Ele olha a tela como o usuário olha — texto visível e papel
 * acessível — porque é isso que continua valendo depois de um refactor.
 */
import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import RoleBadge from './index'

describe('<RoleBadge />', () => {
  it('mostra "Admin" para o papel ADMIN', () => {
    renderWithProviders(<RoleBadge role="ADMIN" />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('mostra "Owner" para o papel OWNER', () => {
    renderWithProviders(<RoleBadge role="OWNER" />)
    expect(screen.getByText('Owner')).toBeInTheDocument()
  })

  it('cai no rótulo genérico "Usuário" para PLAYER, que não tem entrada própria', () => {
    renderWithProviders(<RoleBadge role="PLAYER" />)
    expect(screen.getByText('Usuário')).toBeInTheDocument()
  })

  it('aplica a cor do papel no texto', () => {
    renderWithProviders(<RoleBadge role="ADMIN" />)
    expect(screen.getByText('Admin')).toHaveStyle({ color: '#d97706' })
  })
})
