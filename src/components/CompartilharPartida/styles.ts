import styled from 'styled-components'

/**
 * O modal de compartilhar o link da pelada (#229).
 *
 * Segue a forma do `SorteioDeTimes`, que é o outro modal aberto a partir do
 * detalhe da pelada — dois modais irmãos com molduras diferentes pareceriam
 * dois produtos.
 */

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.bgOverlay};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing[4]};
`

export const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.radii.xl};
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;

  h2 {
    margin-bottom: ${({ theme }) => theme.spacing[2]};
    font-size: ${({ theme }) => theme.fontSizes.xl};
  }
`

export const Subtitulo = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`

/** A caixa com o link em si — a coisa que a pessoa veio buscar. */
export const LinkBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgPage};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`

/**
 * O link quebra em vez de virar reticências.
 *
 * Quem confere um link antes de mandar no grupo confere o fim dele — é onde
 * mora o token. Cortar justamente essa parte tiraria o único trecho que a
 * pessoa tem motivo para ler.
 */
export const LinkTexto = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow-wrap: anywhere;
`

export const Acoes = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`

export const BotaoPrincipal = styled.button`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const BotaoSecundario = styled(BotaoPrincipal)`
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
`

export const SecaoDeLinks = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  padding-top: ${({ theme }) => theme.spacing[4]};
`

export const TituloDaSecao = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`

export const ItemDeLink = styled.div<{ $inativo: boolean; }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  opacity: ${({ $inativo }) => ($inativo ? 0.55 : 1)};

  &:last-child {
    border-bottom: none;
  }
`

export const DadosDoLink = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

export const BotaoDeRevogar = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.error};
  background: transparent;
  color: ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 4px 10px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  flex-shrink: 0;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const Etiqueta = styled.span<{ $tom: 'ativo' | 'inativo'; }>`
  font-size: 10px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $tom, theme }) =>
    $tom === 'ativo' ? theme.colors.successLight : theme.colors.bgPage};
  color: ${({ $tom, theme }) =>
    $tom === 'ativo' ? theme.colors.success : theme.colors.textMuted};
  white-space: nowrap;
`

export const Vazio = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`

export const Fechar = styled.button`
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing[5]};
  padding: ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
`
