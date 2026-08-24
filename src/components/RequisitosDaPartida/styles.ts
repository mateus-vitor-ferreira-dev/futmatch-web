import styled from 'styled-components'

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

export const Item = styled.li<{ $estado: 'ok' | 'falta' | 'neutro' }>`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme, $estado }) =>
    $estado === 'falta' ? theme.colors.error : theme.colors.textPrimary};
`

export const Marca = styled.span`
  flex-shrink: 0;
  line-height: 1.4;
`

export const Texto = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

export const Falta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

/** A versão compacta, para o card da busca. */
export const Etiqueta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

/**
 * Texto que só o leitor de tela vê.
 *
 * O projeto não tem uma classe utilitária para isso, e inventar um `sr-only`
 * sem CSS por trás deixaria o texto visível — que é pior que não ter.
 *
 * `clip-path` em vez de `display: none` ou `visibility: hidden`, porque esses
 * dois removem o elemento também da árvore de acessibilidade: o leitor de tela
 * deixaria de ler junto com todo mundo.
 */
export const ApenasLeitor = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`
