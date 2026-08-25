import styled from 'styled-components'

/**
 * Estilos do sorteio de times.
 *
 * Moraram em `pages/MinhasPartidas/styles.ts` enquanto o sorteio existia numa
 * tela só. Mudaram de casa junto com o modal (#266): o detalhe da partida
 * passou a oferecer o sorteio também, e manter duas cópias garantiria que uma
 * delas ficaria para trás na próxima mudança.
 */

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
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;

  h2 {
    margin-bottom: ${({ theme }) => theme.spacing[2]};
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
  }
`

/** Local e data da partida, logo abaixo do título do modal. */
export const Subtitulo = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`

export const CampoQuantidade = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  label {
    display: block;
    font-weight: 600;
    margin-bottom: ${({ theme }) => theme.spacing[2]};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  .controle {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing[4]};
  }

  input[type='range'] {
    flex: 1;
    accent-color: ${({ theme }) => theme.colors.primary};
    height: 6px;
  }

  .numero {
    font-weight: 700;
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
    color: ${({ theme }) => theme.colors.primary};
    min-width: 40px;
    text-align: center;
  }

  .ajuda {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-top: ${({ theme }) => theme.spacing[2]};
  }
`

/**
 * Mesma régua do `ButtonGroup` de "Minhas Partidas", que o modal usava antes da
 * mudança de casa. Copiar a régua e não importar da página é de propósito: um
 * componente compartilhado que importa estilo de uma tela específica volta a
 * amarrar os dois.
 */
export const AcoesDoModal = styled.div`
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

/**
 * Cabeçalho do resultado do sorteio. Centralizado só aqui — o passo anterior,
 * com o slider, tem rótulo à esquerda, e centralizar o título dele
 * desalinharia com o próprio conteúdo.
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

/**
 * As duas saídas do resultado, lado a lado: refazer e fechar (#267).
 *
 * "Refazer sorteio" fica à esquerda e discreto; "Fechar" continua verde e à
 * direita, no lugar onde já estava. Refazer é a ação que o organizador repete
 * até o confronto parecer justo, e ela não deve competir com a de sair.
 */
export const AcoesDoResultado = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[4]};

  button {
    flex: 1;
    padding: ${({ theme }) => theme.spacing[3]};
    border-radius: ${({ theme }) => theme.radii.lg};
    font-weight: 700;
    cursor: pointer;
    font-size: ${({ theme }) => theme.fontSizes.md};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .refazer {
    background: ${({ theme }) => theme.colors.bgCard};
    color: ${({ theme }) => theme.colors.textSecondary};
    border: 1px solid ${({ theme }) => theme.colors.border};

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .fechar {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textOnPrimary};
    border: none;
  }

  /* Abaixo de 480px os dois rótulos não cabem lado a lado sem quebrar linha
     no meio da palavra. Empilhados, "Fechar" continua sendo o de baixo — o
     último da leitura, como já era quando ele era o único. */
  @media (max-width: 480px) {
    flex-direction: column;
  }
`

/**
 * O botão que abre o sorteio. Mora aqui e não na tela porque as duas telas que
 * oferecem o sorteio precisam dele com a mesma cara — o cartão de "Minhas Partidas"
 * e as ações do organizador no detalhe da partida.
 */
export const SortearBtn = styled.button`
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

/**
 * Escolha do modo, antes de sortear (#215).
 *
 * Dois cartões e não um `select`: o modo equilibrado é a novidade que a maioria
 * não sabe que existe, e escondê-lo dentro de uma lista suspensa garante que
 * ninguém descubra. Cada cartão carrega a explicação de uma linha, que é o que
 * responde "qual eu escolho?" sem obrigar a ler documentação.
 */
export const EscolhaDeModo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};

  /* Empilhado no celular: lado a lado, a explicação de cada modo vira três
     linhas de duas palavras. */
  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`

export const OpcaoDeModo = styled.button<{ $ativo?: boolean; }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: ${({ theme }) => theme.spacing[3]};
  text-align: left;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 2px solid ${({ theme, $ativo }) => ($ativo ? theme.colors.primary : theme.colors.border)};
  background: ${({ theme, $ativo }) => ($ativo ? theme.colors.primarySubtle : theme.colors.bgCard)};

  strong {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme, $ativo }) => ($ativo ? theme.colors.primaryDark : theme.colors.textPrimary)};
  }

  span {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.4;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

/** Faixa com o índice do time, no cabeçalho colorido de cada cartão. */
export const ForcaDoTime = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  opacity: 0.9;
`

/**
 * Resumo do equilíbrio, logo abaixo do cabeçalho do resultado.
 *
 * Existe porque uma lista de nomes não explica nada: o organizador precisa ver
 * o quanto ficou parelho para confiar — ou para decidir refazer.
 */
export const ResumoDoEquilibrio = styled.div<{ $bom?: boolean; }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme, $bom }) => ($bom ? theme.colors.successLight : theme.colors.warningBorder)};
  background: ${({ theme, $bom }) => ($bom ? theme.colors.successLight : theme.colors.warningLight)};
  color: ${({ theme, $bom }) => ($bom ? theme.colors.primaryDark : theme.colors.warningText)};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  .aviso {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    opacity: 0.9;
  }
`
