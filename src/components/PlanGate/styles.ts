import styled from 'styled-components'

/**
 * Ocupa o lugar da página, e não a cobre.
 *
 * O `SubscriptionGate` sobrepõe um overlay ao conteúdo esmaecido porque a tela é do
 * dono e está apenas travada até a fatura sair. Aqui é outra coisa: a tela não faz
 * parte do que ele contratou, e mostrá-la desbotada atrás venderia por espiada o que
 * a tela de planos vende direito.
 */
export const Tela = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 24px;
`

export const Box = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 36px 40px;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  text-align: center;
  max-width: 380px;
`

export const Icon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primarySubtle};
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`

export const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
  text-wrap: balance;
`

export const Desc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`

/** Discreto: é um instante de verificação, não uma recusa. */
export const Carregando = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgCard};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    animation: girar 1s linear infinite;
  }

  @keyframes girar {
    to {
      transform: rotate(360deg);
    }
  }

  /* Respeita quem pediu menos movimento no sistema. */
  @media (prefers-reduced-motion: reduce) {
    svg {
      animation: none;
    }
  }
`

export const Btn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-family: ${({ theme }) => theme.fonts.sans};
  cursor: pointer;
  transition: opacity 0.15s;
  margin-top: 4px;

  &:hover {
    opacity: 0.88;
  }
`
