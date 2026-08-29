import styled, { css } from 'styled-components'

export const Bloco = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgPage};
`

export const Titulo = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
`

/**
 * `$atropela` marca a ocupação que cruza o horário escolhido agora.
 *
 * A lista inteira é informação; **uma** linha dela é o problema, e sem destaque
 * a pessoa relê seis marcações para achar qual foi. O aviso de erro diz a mesma
 * coisa por escrito — quem não distingue a cor não fica sem a informação.
 */
export const Descricao = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 0;
  overflow-wrap: anywhere;
`

export const Item = styled.li<{ $atropela: boolean }>`
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme, $atropela }) =>
    $atropela ? theme.colors.error : theme.colors.textPrimary};
  font-weight: ${({ theme, $atropela }) =>
    $atropela ? theme.fontWeights.semibold : theme.fontWeights.regular};

  /*
    Na linha em conflito a descrição acompanha o horário em vez de seguir
    cinza. No mobile a linha quebra em duas, e metade destacada com a outra
    metade apagada não lê como uma coisa só — parecem duas marcações.
  */
  ${({ $atropela }) =>
    $atropela &&
    css`
      ${Descricao} {
        color: inherit;
      }
    `}
`

export const Faixa = styled.span`
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
`

export const Vazio = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Aviso = styled.p<{ $tom: 'erro' | 'atencao' }>`
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme, $tom }) =>
    $tom === 'erro' ? theme.colors.error : theme.colors.warningText};
  background: ${({ theme, $tom }) =>
    $tom === 'erro' ? theme.colors.errorLight : theme.colors.warningLight};
`
