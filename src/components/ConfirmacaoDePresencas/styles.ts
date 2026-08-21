import styled from 'styled-components'

export { ModalOverlay, ModalContent, AcoesDoModal } from '../SorteioDeTimes/styles'

export const Subtitulo = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`

export const Mensagem = styled.p<{ $erro?: boolean }>`
  color: ${({ $erro, theme }) => $erro ? theme.colors.error : theme.colors.textSecondary};
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
`

export const Lista = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
  max-height: 320px;
  overflow-y: auto;
`

export const Participante = styled.button<{ $presente: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ $presente, theme }) => $presente ? theme.colors.success : theme.colors.border};
  background: ${({ $presente, theme }) => $presente ? theme.colors.successLight : theme.colors.bgPage};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
`

export const Nome = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`

export const Estado = styled.span<{ $presente: boolean }>`
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $presente, theme }) => $presente ? theme.colors.successLight : theme.colors.borderLight};
  color: ${({ $presente, theme }) => $presente ? theme.colors.success : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`

