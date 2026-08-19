import styled from 'styled-components'

export const Bloco = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};
`

export const Titulo = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Partida = styled.article`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  }
`

export const Topo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`

export const Onde = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

export const Confronto = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Contexto = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Botao = styled.button`
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 7px 14px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
`

export const Resultado = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  padding: 3px 8px;
  border-radius: 999px;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.success};
  background: ${({ theme }) => theme.colors.successLight};
`
