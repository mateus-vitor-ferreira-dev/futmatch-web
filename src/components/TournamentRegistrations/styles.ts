import styled from 'styled-components'

export type EstadoTom = 'ok' | 'espera' | 'recusa'

export const Bloco = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

export const Divisao = styled.section`
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`

export const CabecalhoDaDivisao = styled.header`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 14px;
  background: ${({ theme }) => theme.colors.bgPage};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`

export const NomeDaDivisao = styled.h4`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Vagas = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Linha = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 14px;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  }
`

export const Pessoa = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

export const NomeDaPessoa = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
`

export const Email = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  overflow: hidden;
  text-overflow: ellipsis;
`

export const Acoes = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

export const Estado = styled.span<{ $tom: EstadoTom }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  padding: 3px 8px;
  border-radius: 999px;
  white-space: nowrap;
  color: ${({ theme, $tom }) =>
    $tom === 'ok' ? theme.colors.success : $tom === 'recusa' ? theme.colors.error : theme.colors.warning};
  background: ${({ theme, $tom }) =>
    $tom === 'ok'
      ? theme.colors.successLight
      : $tom === 'recusa'
        ? theme.colors.errorLight
        : theme.colors.warningLight};
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

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

export const BotaoRecusa = styled(Botao)`
  background: transparent;
  color: ${({ theme }) => theme.colors.error};
  border: 1px solid ${({ theme }) => theme.colors.error};
`

export const BotaoNeutro = styled(Botao)`
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
`

export const CaixaDeRecusa = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 10px 14px 14px;
  border-top: 1px dashed ${({ theme }) => theme.colors.borderLight};
`

export const Justificativa = styled.textarea`
  width: 100%;
  min-height: 64px;
  resize: vertical;
  padding: 8px 10px;
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
`

export const Nota = styled.p<{ $erro?: boolean }>`
  margin: 0;
  padding: 0 14px 12px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme, $erro }) => ($erro ? theme.colors.error : theme.colors.textMuted)};
`

export const Vazio = styled.p`
  margin: 0;
  padding: 14px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`
