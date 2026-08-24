import styled from 'styled-components'

export { ModalOverlay, ModalContent, AcoesDoModal } from '../SorteioDeTimes/styles'

export const Subtitulo = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`

export const Mensagem = styled.p<{ $erro?: boolean }>`
  color: ${({ $erro, theme }) => ($erro ? theme.colors.error : theme.colors.textSecondary)};
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
`

export const NotaDeEfeito = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgPage};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: 1.45;
`
