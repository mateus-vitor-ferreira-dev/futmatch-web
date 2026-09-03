import styled from 'styled-components'

export const Voltar = styled.button`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 16px;
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;

  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`

export const Caixa = styled.section`
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgCard};
`

export const Topo = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;

  @media (max-width: 560px) {
    flex-direction: column;
  }
`

export const TituloDaCaixa = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Explicacao = styled.p`
  margin: 4px 0 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.55;
`

export const Ocupacao = styled.span<{ $lotada: boolean }>`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  white-space: nowrap;
  background: ${({ theme, $lotada }) => ($lotada ? theme.colors.warningLight : theme.colors.primaryLight)};
  color: ${({ theme, $lotada }) => ($lotada ? theme.colors.warningText : theme.colors.primaryDark)};
`

export const Form = styled.form`
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr auto;
  align-items: start;

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
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Input = styled.input<{ $erro?: boolean }>`
  min-height: 44px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.875rem;
  border: 1px solid ${({ theme, $erro }) => ($erro ? theme.colors.error : theme.colors.border)};
  background: ${({ theme }) => theme.colors.bgInput};
  color: ${({ theme }) => theme.colors.textPrimary};

  &:focus {
    outline: 2px solid ${({ theme, $erro }) => ($erro ? theme.colors.error : theme.colors.primary)};
    outline-offset: 1px;
  }
`

export const ErroDoCampo = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.error};
`

export const Botao = styled.button`
  display: inline-flex;
  gap: 8px;
  align-items: center;
  align-self: end;
  min-height: 44px;
  padding: 0 16px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.primaryHover}; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`

export const BotaoLeve = styled.button`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`

export const Lotada = styled.p`
  margin: 0;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.warningBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.warningLight};
  color: ${({ theme }) => theme.colors.warningText};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
`

export const Alternador = styled.label`
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
`

export const Lista = styled.ul`
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
`

export const Item = styled.li<{ $saiu?: boolean }>`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  opacity: ${({ $saiu }) => ($saiu ? 0.55 : 1)};

  @media (max-width: 560px) {
    flex-direction: column;
    align-items: flex-start;
  }
`

export const Dados = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

export const Nome = styled.strong`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Contato = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Quando = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

/**
 * A marca de quem tem conta no Só+1.
 *
 * Discreta de propósito: ter conta não é status, não é melhor e não muda o que
 * dá para fazer com a matrícula. O caso normal é **não** ter.
 */
export const TemConta = styled.span`
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
`

export const Acoes = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`

export const Vazio = styled.p`
  margin: 0;
  padding: 24px 0;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
`

export const Erro = styled.p`
  margin: 0;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.errorLight};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`
