import styled from 'styled-components'

export type EstadoTom = 'neutro' | 'ok' | 'espera' | 'recusa'

export const Lista = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

export const Card = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgCard};
`

export const Identificacao = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

export const Nome = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Vagas = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Acao = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

export const Botao = styled.button`
  padding: 7px 14px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover:not(:disabled) { opacity: 0.88; }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`

export const BotaoSecundario = styled(Botao)`
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.error};
    border-color: ${({ theme }) => theme.colors.error};
    opacity: 1;
  }
`

const TONS = {
  neutro: 'textSecondary',
  ok: 'success',
  espera: 'warning',
  recusa: 'error',
} as const

export const Estado = styled.span<{ $tom: EstadoTom }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme, $tom }) => theme.colors[TONS[$tom]]};
`

/**
 * O texto que explica por que não dá para se inscrever, ou o erro que a API
 * devolveu. Ocupa a linha inteira do cartão, abaixo do resto.
 */
export const Motivo = styled.p<{ $erro?: boolean }>`
  margin: 0;
  flex-basis: 100%;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme, $erro }) => ($erro ? theme.colors.error : theme.colors.textSecondary)};
`

export const Aviso = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

/** Um link com cara de link, dentro de um parágrafo — sem virar `<a href="#">`. */
export const LinkBotao = styled.button`
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: underline;
  cursor: pointer;
`
