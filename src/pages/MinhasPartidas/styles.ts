import styled from 'styled-components'

export const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 1200px;
  margin: 0 auto;
`

export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  h1 {
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

export const CreateButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.radii.full};
  font-weight: bold;
  border: none;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.md};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`

/**
 * O vazio de cada aba (#379).
 *
 * Mesmo desenho do `/times`, e de propósito: as duas telas dizem a mesma coisa
 * ("não há nada aqui, e é daqui que se sai disso"), e um segundo visual para o
 * mesmo estado só faria o produto parecer montado por duas pessoas que não se
 * falaram.
 */
export const EmptyState = styled.div`
  text-align: center;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing[8]};

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: ${({ theme }) => theme.spacing[2]};
  }

  p {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    margin-bottom: ${({ theme }) => theme.spacing[5]};
  }
`

export const Tabs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`

export const Tab = styled.button<{ $active?: boolean; }>`
  background: none;
  border: none;
  padding: ${({ theme }) => theme.spacing[3]} 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.fontWeights.bold : theme.fontWeights.medium};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.textSecondary};
  border-bottom: 3px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  cursor: pointer;
`

export const PixBox = styled.div`
  background: ${({ theme }) => theme.colors.bgApp};
  border: 1px dashed ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing[4]};

  span {
    font-family: monospace;
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  button {
    background: transparent;
    border: none;
    color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: bold;
  }
`

// Estilos do Modal
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.colors.bgOverlay};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

export const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.radii.xl};
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;

  h2 {
    margin-bottom: ${({ theme }) => theme.spacing[6]};
  }
`

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};

  label {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 4px;
    display: block;
  }

  input,
  select {
    width: 100%;
    padding: ${({ theme }) => theme.spacing[3]};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.md};
    font-family: ${({ theme }) => theme.fonts.sans};
    background: ${({ theme }) => theme.colors.bgInput};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`
export const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[6]};

  button {
    flex: 1;
    padding: ${({ theme }) => theme.spacing[3]};
    border-radius: ${({ theme }) => theme.radii.md};
    font-weight: bold;
    cursor: pointer;
    border: none;
  }

  .cancel {
    background: ${({ theme }) => theme.colors.borderLight};
    color: ${({ theme }) => theme.colors.textSecondary};
  }
  .submit {
    background: ${({ theme }) => theme.colors.primary};
    color: white;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
`
