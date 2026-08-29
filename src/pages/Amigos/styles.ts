import styled from 'styled-components'

export const Container = styled.div`
  max-width: 780px;
  margin: 0 auto;
  padding: 24px 16px 48px;
`

export const Cabecalho = styled.header`
  margin-bottom: 24px;
`

export const Titulo = styled.h1`
  margin: 0 0 4px;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Subtitulo = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Abas = styled.div`
  display: flex;
  gap: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  overflow-x: auto;
`

export const Aba = styled.button<{ $ativa: boolean }>`
  flex-shrink: 0;
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
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

export const Explicacao = styled.p`
  margin: 16px 0 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`
