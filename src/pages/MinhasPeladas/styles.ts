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

export const DrawButton = styled.button`
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.infoLight};
  color: ${({ theme }) => theme.colors.info};
  border: 1px solid ${({ theme }) => theme.colors.info};
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    background: ${({ theme }) => theme.colors.info};
    color: white;
  }
`

export const DrawModalOverlay = styled.div`
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

export const DrawModalContent = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.radii.xl};
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;

  h2 {
    margin-bottom: ${({ theme }) => theme.spacing[2]};
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
  }
`

/**
 * Cabeçalho do resultado do sorteio. Centralizado só aqui — o modal de
 * "Sortear Times" que vem antes tem um formulário com rótulos à esquerda, e
 * centralizar o título dele desalinharia com o próprio conteúdo.
 */
export const DrawResultHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  p {
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-top: ${({ theme }) => theme.spacing[2]};
  }
`

export const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
`

/**
 * Layout de confronto — só para 2 times.
 *
 * O slider de "Quantos times?" vai de 2 a 10, e o ✕ do meio só quer dizer
 * alguma coisa quando são exatamente dois. Com 3+ o resultado continua no
 * `TeamGrid`, que é a grade de sempre.
 *
 * `align-items: start` para que times de tamanhos diferentes (número ímpar de
 * confirmados) não estiquem o cartão menor até a altura do maior.
 */
export const TeamVersus = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
  gap: ${({ theme }) => theme.spacing[3]};

  /* Abaixo de 480px os dois cartões espremeriam o nome dos jogadores. O ✕ vai
     para o meio da coluna, entre um time e outro, e o confronto se lê de cima
     para baixo. */
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

export const VersusMark = styled.span`
  align-self: center;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: 800;
  line-height: 1;
  user-select: none;
`

export const TeamCard = styled.div<{ $color?: string; }>`
  border: 2px solid ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`

export const TeamHeader = styled.div<{ $color?: string; }>`
  background: ${({ $color }) => $color};
  color: white;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  font-weight: 700;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
`

export const PlayerItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};

  &:last-child {
    border-bottom: none;
  }

  .avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primaryLight};
    color: ${({ theme }) => theme.colors.primaryDark};
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 12px;
    flex-shrink: 0;
  }
`
