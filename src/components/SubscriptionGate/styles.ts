import styled from 'styled-components'

export const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
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
 * A faixa de aviso da assinatura — a única, desde a #244.
 *
 * Serve tanto ao pagamento em atraso quanto à assinatura inativa. Fica **no
 * fluxo**, acima do conteúdo, e não sobreposta: a tela continua consultável nos
 * dois casos, e um overlay diria o contrário.
 *
 * Havia duas para o mesmo tipo de recado — esta e um `SubscriptionNotice`
 * escrito à mão no Estoque. Sobrou uma.
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
