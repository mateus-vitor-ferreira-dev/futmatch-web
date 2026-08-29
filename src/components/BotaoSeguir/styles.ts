import styled, { css } from 'styled-components'

/**
 * `$seguindo` inverte o peso do botão, e não só a palavra.
 *
 * Seguir é a ação que se oferece; deixar de seguir é a que se guarda. Um botão
 * verde escrito "Seguindo" convida ao toque que desfaz — é o erro clássico
 * desse par. Preenchido para seguir, contornado para o estado já alcançado.
 */
export const Botao = styled.button<{ $seguindo: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  ${({ theme, $seguindo }) =>
    $seguindo
      ? css`
          border: 1px solid ${theme.colors.border};
          background: transparent;
          color: ${theme.colors.textSecondary};

          &:hover:not(:disabled) {
            border-color: ${theme.colors.error};
            color: ${theme.colors.error};
          }
        `
      : css`
          border: 1px solid ${theme.colors.primary};
          background: ${theme.colors.primary};
          color: #fff;

          &:hover:not(:disabled) {
            background: ${theme.colors.primaryHover};
            border-color: ${theme.colors.primaryHover};
          }
        `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

/**
 * O selo de amizade, ao lado do botão e não dentro dele.
 *
 * Amigo é sempre alguém que eu sigo, então o botão já diz "Seguindo" — juntar
 * as duas informações num rótulo só ("Amigos") esconderia que existe um follow
 * meu ali para desfazer, que é o que o toque faz.
 */
export const SeloDeAmizade = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`

export const Linha = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`
