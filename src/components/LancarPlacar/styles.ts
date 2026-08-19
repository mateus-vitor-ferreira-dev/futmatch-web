import styled from 'styled-components'

export const Caixa = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};
`

export const Confronto = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const LadoDoPlacar = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

export const NomeDoLado = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
`

export const CampoDePlacar = styled.input`
  width: 72px;
  flex-shrink: 0;
  padding: 6px 8px;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.bgInput};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
`

export const EscolhaDoWo = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
`

export const Acoes = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

export const Botao = styled.button`
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 8px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

export const BotaoNeutro = styled(Botao)`
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
`

export const Aviso = styled.p<{ $erro?: boolean }>`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme, $erro }) => ($erro ? theme.colors.error : theme.colors.textMuted)};
`

export const Confirmacao = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.warningLight};
  border: 1px solid ${({ theme }) => theme.colors.warningBorder};
`

export const TextoDaConfirmacao = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.warningText};
`
