import styled from 'styled-components'

export const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`

export const Box = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 40px;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  text-align: center;
  max-width: 340px;
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
`

export const Desc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`

/**
 * Estado de verificação: discreto de propósito. Não é um erro nem um bloqueio
 * definitivo, é um instante — uma caixa do tamanho do overlay de bloqueio
 * pareceria uma recusa e assustaria quem está em dia.
 */
export const Carregando = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);

  svg { animation: girar 1s linear infinite; }

  @keyframes girar {
    to { transform: rotate(360deg); }
  }

  /* Respeita quem pediu menos movimento no sistema. */
  @media (prefers-reduced-motion: reduce) {
    svg { animation: none; }
  }
`

/**
 * Aviso de pagamento em atraso. Fica **no fluxo**, acima do conteúdo, e não
 * sobreposto: nada aqui está bloqueado, e um overlay diria o contrário.
 */
export const Aviso = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px 16px;
  margin-bottom: 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: #fef3c7;
  border: 1px solid #fcd34d;
  color: #92400e;
`

export const AvisoTexto = styled.span`
  flex: 1;
  min-width: 200px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
`

export const AvisoBtn = styled.button`
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid #92400e;
  background: transparent;
  color: #92400e;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-family: ${({ theme }) => theme.fonts.sans};
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: rgba(146, 64, 14, 0.10); }
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
  cursor: pointer;
  font-family: ${({ theme }) => theme.fonts.sans};
  transition: opacity 0.15s;
  margin-top: 4px;

  &:hover { opacity: 0.88; }
`
