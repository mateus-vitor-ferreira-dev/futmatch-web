import styled from 'styled-components'

export const Wrapper = styled.div`
  display: flex;
  min-height: 100vh;
  font-family: ${({ theme }) => theme.fonts.sans};
`

/* ── Left panel ──────────────────────────────────────────────────────────── */

export const LeftPanel = styled.div`
  display: none;
  flex-direction: column;
  width: 58%;
  min-height: 100vh;
  padding: 36px 44px 32px;
  position: relative;
  overflow: hidden;
  background: #0a0a0a;   /* fallback enquanto imagem carrega */

  @media (min-width: 860px) { display: flex; }
`

/* Camada de imagem — duas divs absolutas fazem o crossfade */
export const BgImage = styled.div<{ $url?: string | null; $visible?: boolean }>`
  position: absolute;
  inset: 0;
  background: ${({ $url }) =>
    $url ? `url("${$url}") center/cover no-repeat` : '#0a1628'};
  transition: opacity 0.9s ease;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  z-index: 0;
`

/* Overlay escuro para legibilidade do texto sobre qualquer imagem */
export const BgOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(0,0,0,0.72) 0%,
    rgba(0,0,0,0.50) 50%,
    rgba(0,0,0,0.65) 100%
  );
  z-index: 1;
`

/* ── Logo ────────────────────────────────────────────────────────────────── */

export const Logo = styled.div`
  display: flex; align-items: center; gap: 10px; z-index: 1;
`
export const LogoIcon    = styled.span`font-size: 26px; line-height: 1;`
export const LogoText    = styled.div`display: flex; flex-direction: column;`
export const LogoName    = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: #fff; line-height: 1.1;
`
export const LogoTagline = styled.span`font-size: 11px; color: rgba(255,255,255,0.7);`

/* ── Center content ──────────────────────────────────────────────────────── */

export const LeftCenter = styled.div`
  z-index: 1; flex: 1;
  display: flex; flex-direction: column;
  justify-content: center; gap: 16px;
  padding-bottom: 80px;
`

export const Headline = styled.h1`
  font-size: 2.6rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: #fff; margin: 0; line-height: 1.15;
  text-shadow: 0 2px 16px rgba(0,0,0,0.55);
`

export const HeadlineDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: rgba(255,255,255,0.92);
  margin: 0; max-width: 340px; line-height: 1.6;
  text-shadow: 0 1px 8px rgba(0,0,0,0.5);
`

/* ── Ferris Wheel ────────────────────────────────────────────────────────── */

export const WheelTrack = styled.div`
  position: relative;
  height: 260px;           /* mostra janela de 5 itens */
  overflow: hidden;
  /* fade-out suave no topo e no rodapé */
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0,0,0,0.6) 18%,
    black 35%,
    black 65%,
    rgba(0,0,0,0.6) 82%,
    transparent 100%
  );
`

/**
 * Altura de cada cartão da roda, em px — a mesma para o item em foco e para
 * os demais.
 *
 * É exportada porque o `index.tsx` usa este mesmo número como distância entre
 * os centros de dois itens vizinhos. Enquanto os dois forem o mesmo número,
 * cartão nenhum alcança o vizinho; foi separá-los que produziu a #243, em que
 * o item ativo media ~67 px dentro de um slot de 56 px e derramava o excedente
 * por cima do rótulo de baixo.
 *
 * O que sustenta a igualdade de altura, e precisa continuar valendo:
 *
 *  - `height` fixo aqui, e não altura derivada do conteúdo;
 *  - `WheelIcon` numa caixa de tamanho fixo, com só a fonte crescendo dentro;
 *  - `WheelSub` renderizado sempre, escondido por `visibility` fora do foco;
 *  - nome e descrição em uma linha só, com reticências no que não couber.
 */
export const WHEEL_ITEM_HEIGHT = 56

export const WheelItem = styled.div<{ $active?: boolean; }>`
  position: absolute;
  left: 0; right: 0;
  /* topo calculado via style inline; o translateY(-50%) de lá ancora o cartão
     pelo centro, para que a folga sobre e falte igual para cima e para baixo */
  height: ${WHEEL_ITEM_HEIGHT}px;
  /* garantia final: o que não couber é cortado aqui, e não invade o vizinho */
  overflow: hidden;
  transition: transform 0.55s cubic-bezier(.4,0,.2,1),
              opacity   0.55s cubic-bezier(.4,0,.2,1);
  transform-origin: center center;
  display: flex;
  align-items: center;
  gap: 14px;
  /* só padding horizontal: com altura fixa, o vertical mudaria o recorte do
     conteúdo sem mudar a altura, e é o que fazia o item ativo crescer */
  padding: ${({ $active }) => $active ? '0 18px' : '0 16px'};
  background: ${({ $active }) =>
    $active ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'};
  border: ${({ $active }) =>
    $active ? '1.5px solid rgba(255,255,255,0.35)' : '1.5px solid transparent'};
  border-radius: ${({ theme }) => theme.radii.lg};
  backdrop-filter: ${({ $active }) => $active ? 'blur(4px)' : 'none'};
  cursor: ${({ $active }) => $active ? 'default' : 'pointer'};
`

export const WheelIcon = styled.span<{ $active?: boolean; }>`
  /* caixa do tamanho do ícone em foco: a fonte cresce dentro dela, e a linha
     do cartão não muda de altura por causa disso */
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ $active }) => $active ? '28px' : '20px'};
  line-height: 1;
  transition: font-size 0.4s ease;
  flex-shrink: 0;
`

/* `min-width: 0` para que as reticências de baixo funcionem dentro do flex */
export const WheelText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

export const WheelName = styled.span<{ $active?: boolean; }>`
  font-size: ${({ $active, theme }) =>
    $active ? theme.fontSizes.md : theme.fontSizes.sm};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.fontWeights.bold : theme.fontWeights.medium};
  color: #fff;
  transition: font-size 0.4s ease;
  text-shadow: 0 1px 6px rgba(0,0,0,0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const WheelSub = styled.span<{ $active?: boolean; }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: rgba(255,255,255,0.88);
  text-shadow: 0 1px 6px rgba(0,0,0,0.4);
  /* Renderizada em todos os itens, para que todos ocupem a mesma altura.
     visibility, e não display nem condicional no JSX, porque ela reserva o
     espaço e ainda assim tira o texto da leitura e da árvore de acessibilidade
     de quem não está em foco. */
  visibility: ${({ $active }) => $active ? 'visible' : 'hidden'};
  opacity: ${({ $active }) => $active ? 1 : 0};
  transition: opacity 0.4s ease, visibility 0.4s ease;
  /* a descrição vem da API: uma linha longa quebraria em duas e reintroduziria
     exatamente a diferença de altura que esta issue fechou */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

/* ── Stats cards ─────────────────────────────────────────────────────────── */

export const StatsRow = styled.div`
  display: flex;
  gap: 10px;
`

export const StatCard = styled.div`
  flex: 1;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: ${({ theme }) => theme.radii.lg};
  backdrop-filter: blur(6px);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

export const StatValue = styled.span`
  font-size: 1.5rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: #fff;
  line-height: 1;
`

export const StatLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: rgba(255,255,255,0.65);
`

/* ── Quote ───────────────────────────────────────────────────────────────── */

export const LeftQuote = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: rgba(255,255,255,0.5);
  font-style: italic;
  margin: 0; z-index: 1;
`

/* ── Right panel ─────────────────────────────────────────────────────────── */

export const RightPanel = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  background: ${({ theme }) => theme.colors.bgPage};
  min-height: 100vh;
  position: sticky;
  top: 0;
  align-self: flex-start;
`

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: 32px 28px 24px;
  width: 100%;
  max-width: 400px;
`
