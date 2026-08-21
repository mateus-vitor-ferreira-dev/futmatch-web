import styled from 'styled-components'

export const Secao = styled.section`
  margin-top: ${({ theme }) => theme.spacing[6]};
`

export const Explicacao = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  max-width: 60ch;
`

export const Grade = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) 90px;
  gap: ${({ theme }) => theme.spacing[3]};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

export const Campo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`

export const Rotulo = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Entrada = styled.input<{ $erro?: boolean }>`
  width: 100%;
  padding: 10px ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ $erro, theme }) => ($erro ? theme.colors.error : theme.colors.border)};
  background: ${({ theme }) => theme.colors.bgInput};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:disabled {
    background: ${({ theme }) => theme.colors.bgPage};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }
`

export const Dica = styled.small<{ $erro?: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ $erro, theme }) => ($erro ? theme.colors.error : theme.colors.textMuted)};
  line-height: 1.4;
`

export const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[4]};
`

export const Salvar = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px ${({ theme }) => theme.spacing[5]};
  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const Apagar = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.errorLight};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const Aviso = styled.p<{ $erro?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[2]};
  margin: ${({ theme }) => theme.spacing[4]} 0 0;
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ $erro, theme }) => ($erro ? theme.colors.error : theme.colors.border)};
  background: ${({ $erro, theme }) => ($erro ? theme.colors.errorLight : theme.colors.bgPage)};
  color: ${({ $erro, theme }) => ($erro ? theme.colors.error : theme.colors.textSecondary)};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: 1.45;

  svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
`
