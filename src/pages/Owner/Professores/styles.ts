import styled from 'styled-components'

/**
 * O seletor de espaço, no topo — mesmo lugar em que o Estoque e os Equipamentos
 * o põem.
 *
 * A tela entrou pelo menu, e menu não carrega parâmetro: sem o seletor, o dono
 * com dois estabelecimentos não teria como trocar depois de entrar.
 */
export const SeletorDeEspaco = styled.select`
  min-height: 44px;
  margin-bottom: 20px;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  max-width: 100%;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }
`

export const Caixa = styled.section`
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgCard};
`

export const TituloDaCaixa = styled.h2`
  margin: 0 0 4px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Explicacao = styled.p`
  margin: 0 0 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.55;
`

export const Form = styled.form`
  display: flex;
  gap: 10px;
  align-items: flex-start;

  @media (max-width: 560px) {
    flex-direction: column;
  }
`

export const CampoEmail = styled.div`
  flex: 1;
  width: 100%;
`

export const Input = styled.input<{ $erro?: boolean }>`
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid
    ${({ theme, $erro }) => ($erro ? theme.colors.error : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }
`

export const ErroDoCampo = styled.p`
  margin: 6px 0 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.error};
`

export const Convidar = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 10px 20px;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 560px) {
    width: 100%;
  }
`

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
`

export const Item = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgPage};
`

export const Email = styled.span`
  min-width: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow-wrap: anywhere;
`

export const Quando = styled.span`
  display: block;
  margin-top: 2px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.textMuted};
`

/**
 * O selo do estado, e `vencido` é um tom próprio.
 *
 * Vencido não é um `status` no banco: é um `PENDING` cujo prazo passou, e o
 * serviço o trata em tempo de leitura. Pintá-lo igual a pendente esconderia
 * exatamente o convite que o dono precisa reenviar — foi o que sumiu da tela do
 * time quando alguém filtrou só por `PENDING` e esqueceu o prazo.
 */
export const Selo = styled.span<{ $tom: 'pendente' | 'vencido' | 'aceito' | 'recusado' }>`
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  white-space: nowrap;

  ${({ theme, $tom }) => {
    if ($tom === 'aceito') return `background: ${theme.colors.primaryLight}; color: ${theme.colors.primaryDark};`
    if ($tom === 'recusado') return `background: ${theme.colors.errorLight}; color: ${theme.colors.error};`
    if ($tom === 'vencido') return `background: ${theme.colors.warningLight}; color: ${theme.colors.warningText};`
    return `background: ${theme.colors.borderLight}; color: ${theme.colors.textSecondary};`
  }}
`

export const Vazio = styled.p`
  margin: 0;
  padding: 24px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
`

export const Erro = styled.p`
  margin: 0;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.errorLight};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.errorLight};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
`

/**
 * A ressalva de que esta lista é o livro de convites, e não a de professores.
 *
 * Ela existe porque a api ainda não lista os `PlaceMember` de um espaço
 * (api#461). Uma tela que chamasse isto de "professores" estaria afirmando o
 * que não sabe: vínculo criado por outro caminho não aparece aqui.
 */
export const Ressalva = styled.p`
  margin: 12px 0 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.5;
`

/**
 * O link do convite pendente, e por que ele fica numa linha própria (#509).
 *
 * O `Item` é um flex de duas pontas — e-mail à esquerda, selo à direita. O
 * endereço não cabe entre eles sem espremer os dois, então ele usa o
 * `flex-wrap` que já estava lá e ocupa a linha inteira embaixo.
 *
 * Só aparece em convite que ainda abre a porta: a api devolve `inviteUrl` nulo
 * para o respondido e para o vencido, justamente para a tela não oferecer um
 * link que só produz 404 em quem clicar.
 */
export const LinhaDoLink = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding-top: 10px;
  border-top: 1px dashed ${({ theme }) => theme.colors.borderLight};
`

/**
 * O endereço fica **visível**, e não escondido atrás do botão.
 *
 * É o que salva quem teve a área de transferência negada pelo navegador: o
 * `copiar` avisa que falhou e manda selecionar à mão, e isso só é verdade se o
 * texto estiver na tela. Mesmo desenho do `CompartilharPartida`.
 */
export const Endereco = styled.code`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  user-select: all;
`

export const Copiar = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 6px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`
