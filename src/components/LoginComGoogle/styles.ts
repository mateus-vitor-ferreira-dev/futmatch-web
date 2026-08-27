import styled from 'styled-components'

export const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 4px;

  /* força o botão do Google a ocupar a largura total */
  & > div, & iframe { width: 100% !important; }
`

export const Botao = styled.button`
  width: 100%;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.15s, border-color 0.15s;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.borderLight};
    border-color: ${({ theme }) => theme.colors.border};
  }

  &:disabled { opacity: 0.55; cursor: not-allowed; }
`
