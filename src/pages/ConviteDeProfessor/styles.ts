import styled from 'styled-components'
import { Link } from 'react-router-dom'

/**
 * Tela de página inteira, e não card dentro do app.
 *
 * Quem chega aqui vem do e-mail, e pode não ter conta nenhuma. Montá-la dentro
 * do layout autenticado exigiria sessão para ver o que a api entrega sem ela.
 */
export const Fundo = styled.div`
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px 16px;
  background: ${({ theme }) => theme.colors.bgPage};
`

export const Cartao = styled.main`
  width: 100%;
  max-width: 460px;
  padding: 32px 28px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgCard};
  box-shadow: ${({ theme }) => theme.shadows.md};
  text-align: center;
`

export const Emblema = styled.div<{ $tom: 'convite' | 'erro' | 'feito' }>`
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme, $tom }) =>
    $tom === 'erro' ? theme.colors.errorLight : theme.colors.primaryLight};
  color: ${({ theme, $tom }) =>
    $tom === 'erro' ? theme.colors.error : theme.colors.primaryDark};
`

export const Titulo = styled.h1`
  margin: 0 0 8px;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow-wrap: anywhere;
`

export const Texto = styled.p`
  margin: 0 0 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.55;
  overflow-wrap: anywhere;
`

export const Prazo = styled.p`
  margin: 16px 0 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Acoes = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 24px;

  @media (max-width: 420px) {
    flex-direction: column;
  }
`

const base = `
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const Principal = styled.button`
  ${base}
  border: 1px solid ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`

export const Secundario = styled.button`
  ${base}
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.error};
    color: ${({ theme }) => theme.colors.error};
  }
`

export const LinkPrincipal = styled(Link)`
  ${base}
  border: 1px solid ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`

export const LinkSecundario = styled(Link)`
  ${base}
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

/**
 * A caixa da conta errada.
 *
 * Amarelo, e não vermelho: nada falhou. O convite é válido, a pessoa é que está
 * na conta de outra — e a saída é trocar de conta, não tentar de novo.
 */
export const Aviso = styled.div`
  margin-top: 20px;
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.warningBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.warningLight};
  color: ${({ theme }) => theme.colors.warningText};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: left;
  line-height: 1.5;
`

export const ContaAtual = styled.strong`
  overflow-wrap: anywhere;
`
