import styled from 'styled-components'

export const Container = styled.div`
  max-width: 780px;
  margin: 0 auto;
  padding: 24px 16px 48px;
`

export const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

export const Hero = styled.header`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgCard};
`

export const Avatar = styled.div`
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const Identidade = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
`

export const Nome = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow-wrap: anywhere;
`

export const Reputacao = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

/**
 * Os dois contadores da rede, e eles são **botões**.
 *
 * "3 seguidores" que não abre nada é a informação sem o caminho: quem lê o
 * número quer ver quem são. Como abas, e não como duas páginas próprias,
 * porque as duas listas são a mesma coisa vista de dois lados — e ninguém
 * navega para "seguidores" sem estar olhando a pessoa.
 */
export const Contadores = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

export const Aba = styled.button<{ $ativa: boolean }>`
  padding: 10px 14px;
  border: 0;
  border-bottom: 2px solid
    ${({ theme, $ativa }) => ($ativa ? theme.colors.primary : 'transparent')};
  background: none;
  color: ${({ theme, $ativa }) =>
    $ativa ? theme.colors.textPrimary : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme, $ativa }) =>
    $ativa ? theme.fontWeights.semibold : theme.fontWeights.regular};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

export const Erro = styled.div`
  margin: 24px 0;
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.errorLight};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.errorLight};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
`
