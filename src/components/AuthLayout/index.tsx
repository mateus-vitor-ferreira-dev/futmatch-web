import { useState, useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import type { CourtType } from '../../types/api'
import { useSports } from '../../hooks/useSports'
import { useEstatisticas } from '../../hooks/useEstatisticas'
import type { NumerosPublicos } from '../../services/stats'
import {
  Wrapper, LeftPanel, BgImage, BgOverlay,
  Logo, LogoIcon, LogoText, LogoName, LogoTagline,
  LeftCenter, Headline, HeadlineDesc,
  WheelTrack, WheelItem, WheelIcon, WheelText, WheelName, WheelSub,
  WHEEL_ITEM_HEIGHT,
  StatsRow, StatCard, StatValue, StatLabel,
  LeftQuote, RightPanel, Card,
} from './styles'

// Imagens de fundo por modalidade — adicione os arquivos em src/assets/sports/
//
// Todas em WebP e abaixo de 150 kB: eram 4,68 MB em JPG/PNG, com peteca.png
// sozinha em 948 kB e futsal/tenis em 1920x2880 — resolução de retrato grande
// demais para um fundo atrás de overlay escuro. Ver src/assets/orcamento.test.ts,
// que reprova quem passar do teto.
import imgSociety     from '../../assets/sports/society.webp'
import imgCampo       from '../../assets/sports/campo.webp'
import imgFutsal      from '../../assets/sports/futsal.webp'
import imgAreia       from '../../assets/sports/areia.webp'
import imgVolei       from '../../assets/sports/volei.webp'
import imgVoleiAreia  from '../../assets/sports/volei_areia.webp'
import imgHandball    from '../../assets/sports/handball.webp'
import imgPeteca      from '../../assets/sports/peteca.webp'
import imgBeachTennis from '../../assets/sports/beach_tennis.webp'
import imgBasquete    from '../../assets/sports/basquete.webp'
import imgTenis       from '../../assets/sports/tenis.webp'
import imgPoker       from '../../assets/sports/poker.webp'

/** Mapa de id do esporte → imagem de fundo correspondente */
const SPORT_IMAGES: Partial<Record<CourtType, string>> = {
  SOCIETY:      imgSociety,
  CAMPO:        imgCampo,
  FUTSAL:       imgFutsal,
  AREIA:        imgAreia,
  VOLEI:        imgVolei,
  VOLEI_AREIA:  imgVoleiAreia,
  HANDBALL:     imgHandball,
  PETECA:       imgPeteca,
  BEACH_TENNIS: imgBeachTennis,
  BASQUETE:     imgBasquete,
  TENIS:        imgTenis,
  POKER:        imgPoker,
}

/**
 * Distância entre os centros de dois itens vizinhos da roda (px).
 *
 * É a própria altura do cartão, importada de `styles.ts` em vez de repetida
 * aqui: são dois números que precisam ser o mesmo, e mantê-los separados foi
 * o que deixou o item em foco maior que o espaço reservado para ele (#243).
 */
const ITEM_HEIGHT = WHEEL_ITEM_HEIGHT
/** Intervalo de rotação automática da roda (ms) */
const INTERVAL    = 3000

/** Cartão de estatística do painel esquerdo */
interface Cartao {
  value: string
  label: string
}

/**
 * Fatos de produto, que não dependem de tração.
 *
 * Ficam escritos aqui de propósito: o número de modalidades e a gratuidade
 * para o jogador são decisão do produto, não medição do banco. São eles que
 * seguram a linha de pé enquanto os contadores ainda não sustentam afirmação
 * — mesma escolha da landing, em `StatsSection.tsx`.
 */
const FIXOS: Cartao[] = [
  { value: '12',   label: 'modalidades'             },
  { value: '100%', label: 'gratuito para jogadores' },
]

/** Cabem três cartões na linha; o resto sobra para fora do layout. */
const MAX_CARTOES = 3

/**
 * Quanto cada número precisa valer para entrar na tela.
 *
 * Esconder o zero não bastou (`landing#36`): "2 jogadores na plataforma" é
 * verdade e ainda assim prova o contrário do que a linha se propõe a dizer.
 * Prova social responde "outras pessoas usam isso?" — respondida com 2, ela
 * chama atenção justamente para a falta de tração. Sem o cartão, quem chega
 * não conclui nada; com ele, conclui que ninguém usa.
 *
 * Por cartão porque convencem em escalas diferentes: "3 cidades atendidas" é
 * plausível, "3 jogadores" não é.
 *
 * ⚠️ Estes números são os mesmos de `LIMIARES` em
 * `so-mais-um-landing/src/components/landing/StatsSection.tsx`. É a mesma
 * afirmação, dita ao mesmo visitante, em duas telas do mesmo produto — mudar
 * de um lado sem o outro faz as duas discordarem em público.
 */
const LIMIARES = {
  jogadores:      50,
  peladasAbertas:  5,
  cidades:         3,
  arenas:          3,
}

/**
 * Monta os cartões do painel esquerdo a partir do que a API devolveu.
 *
 * Isto existe porque até 11/08/2026 os três números eram constantes escritas
 * no código — `847 jogadores online`, `32 jogos hoje`, `12 cidades` — contra
 * `2 / 0 / 0` reais no banco (#234). É afirmação pública sobre tração, feita
 * em produção a todo visitante não autenticado, e uma ordem de grandeza fora.
 *
 * Duas regras vieram junto:
 *
 * 1. **Rótulo diz o que o dado é.** A rota conta jogadores *cadastrados* e
 *    peladas *abertas*; não existe presença nem recorte de "hoje". Trocar só o
 *    número e manter "online"/"hoje" trocaria uma mentira por outra.
 * 2. **Cartão que não sustenta a afirmação some.** Abaixo do `LIMIARES` ou com
 *    a API fora do ar, ele não aparece — nunca um `0`, nunca um número que
 *    prova o contrário, nunca um valor inventado.
 */
function montarCartoes(numeros: NumerosPublicos | null): Cartao[] {
  const doDado = !numeros
    ? []
    : [
        { valor: numeros.jogadores,      minimo: LIMIARES.jogadores,      label: 'jogadores na plataforma' },
        { valor: numeros.peladasAbertas, minimo: LIMIARES.peladasAbertas, label: 'partidas abertas'        },
        { valor: numeros.arenas,         minimo: LIMIARES.arenas,         label: 'arenas parceiras'        },
        { valor: numeros.cidades,        minimo: LIMIARES.cidades,        label: 'cidades atendidas'       },
      ]
        .filter((cartao) => cartao.valor >= cartao.minimo)
        .map((cartao) => ({ value: String(cartao.valor), label: cartao.label }))

  return [...doDado, ...FIXOS].slice(0, MAX_CARTOES)
}

/**
 * Configuração visual dos 5 slots visíveis da roda de modalidades.
 * offset 0 = item ativo (centro), ±1 e ±2 ficam menores e mais transparentes.
 */
interface Slot {
  scale: number
  opacity: number
}

/** Indexado pelo offset (-2..2) — a busca linear anterior podia não achar nada. */
const SLOTS: Record<number, Slot> = {
  [-2]: { scale: 0.72, opacity: 0.30 },
  [-1]: { scale: 0.86, opacity: 0.60 },
  [0]:  { scale: 1.00, opacity: 1.00 },
  [1]:  { scale: 0.86, opacity: 0.60 },
  [2]:  { scale: 0.72, opacity: 0.30 },
}

const SLOT_PADRAO: Slot = { scale: 0.72, opacity: 0.30 }

/**
 * Layout split-screen para as telas de autenticação.
 *
 * Painel esquerdo:
 *  - Carrossel de imagens de fundo com crossfade suave (2 camadas alternadas).
 *  - "Ferris wheel" de modalidades esportivas com rotação automática a cada 3s.
 *  - Estatísticas da plataforma e frase de impacto.
 *
 * Painel direito:
 *  - Card branco com o conteúdo passado via `children` (formulário de login/registro).
 *
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const { sports } = useSports()
  const { numeros } = useEstatisticas()

  const stats = useMemo(() => montarCartoes(numeros), [numeros])

  /** Índice do esporte ativo na roda */
  const [activeIdx, setActiveIdx] = useState(0)

  /**
   * Duas camadas de imagem de fundo (A e B) que se alternam para criar
   * o efeito de crossfade: enquanto uma aparece (front), a outra carrega
   * a próxima imagem por baixo.
   */
  interface Layers {
    a: string | null
    b: string | null
    front: 'a' | 'b'
  }
  const [layers, setLayers] = useState<Layers>({ a: null, b: null, front: 'a' })

  /** Controla se o crossfade já foi aplicado para o índice atual */
  const prevIdxRef = useRef(-1)

  // Avança automaticamente para o próximo esporte a cada INTERVAL ms
  useEffect(() => {
    if (!sports.length) return
    const t = setInterval(() => setActiveIdx((i) => (i + 1) % sports.length), INTERVAL)
    return () => clearInterval(t)
  }, [sports.length])

  // Atualiza as camadas de crossfade quando o esporte ativo muda
  useEffect(() => {
    if (!sports.length) return
    const sport  = sports[activeIdx]
    const imgUrl = sport ? (SPORT_IMAGES[sport.id] ?? null) : null
    if (prevIdxRef.current === activeIdx) return
    prevIdxRef.current = activeIdx

    setLayers((prev) => {
      // Carrega a nova imagem na camada que está atrás e traz ela para frente
      if (prev.front === 'a') return { a: prev.a, b: imgUrl, front: 'b' }
      return { a: imgUrl, b: prev.b, front: 'a' }
    })
  }, [activeIdx, sports])

  // Inicializa o fundo com a primeira imagem ao carregar os esportes
  useEffect(() => {
    if (!sports.length) return
    const first = sports[0]
    const url   = first ? (SPORT_IMAGES[first.id] ?? null) : null
    setLayers({ a: url, b: null, front: 'a' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sports.length])

  /**
   * Calcula a distância cíclica entre o item i e o item ativo,
   * garantindo que a distância máxima seja sempre ≤ n/2 (caminho mais curto na roda).
   */
  function cyclicDist(i: number): number {
    const n = sports.length
    if (!n) return 0
    const d = ((i - activeIdx) % n + n) % n
    return d > n / 2 ? d - n : d
  }

  const trackCenter = 260 / 2

  return (
    <Wrapper>
      <LeftPanel>
        {/* Crossfade — camada A (fica na frente quando front === 'a') */}
        <BgImage $url={layers.a} $visible={layers.front === 'a'} />
        {/* Crossfade — camada B */}
        <BgImage $url={layers.b} $visible={layers.front === 'b'} />
        {/* Overlay escuro para garantir legibilidade do texto */}
        <BgOverlay />

        <Logo style={{ zIndex: 2 }}>
          <LogoIcon>⚽</LogoIcon>
          <LogoText>
            <LogoName>Só+1</LogoName>
            <LogoTagline>Jogue hoje, sem combinar.</LogoTagline>
          </LogoText>
        </Logo>

        <LeftCenter style={{ zIndex: 2 }}>
          <div>
            <Headline>Encontre seu jogo.<br />Agora mesmo.</Headline>
            <HeadlineDesc style={{ marginTop: 10 }}>
              Futebol, futevôlei, vôlei, beach tennis e muito mais —
              tudo em um lugar só.
            </HeadlineDesc>
          </div>

          {/* Roda de modalidades — exibe 5 itens (offset -2 a +2) */}
          <WheelTrack>
            {sports.map((sport, i) => {
              const d = cyclicDist(i)
              if (Math.abs(d) > 2) return null // fora da janela visível
              const slot     = SLOTS[d] ?? SLOT_PADRAO
              const isActive = d === 0
              /**
               * `top` marca o centro do slot, e o `translateY(-50%)` abaixo
               * puxa o cartão meia altura para cima — a âncora é o centro, não
               * o topo. Com a âncora no topo, qualquer sobra de altura caía
               * inteira para baixo, em cima do vizinho.
               */
              const top      = trackCenter + d * ITEM_HEIGHT

              return (
                <WheelItem
                  key={sport.id}
                  $active={isActive}
                  style={{
                    top,
                    transform: `translateY(-50%) scale(${slot.scale})`,
                    opacity: slot.opacity,
                    zIndex: isActive ? 5 : 4 - Math.abs(d),
                  }}
                  onClick={() => !isActive && setActiveIdx(i)}
                >
                  <WheelIcon $active={isActive}>{sport.icon}</WheelIcon>
                  <WheelText>
                    <WheelName $active={isActive}>{sport.label}</WheelName>
                    {/* renderizada sempre — é ela que iguala a altura dos
                        cartões; fora do foco fica invisível, sem sair do fluxo */}
                    <WheelSub $active={isActive}>{sport.description}</WheelSub>
                  </WheelText>
                </WheelItem>
              )
            })}
          </WheelTrack>

          <StatsRow>
            {stats.map((s) => (
              <StatCard key={s.label}>
                <StatValue>{s.value}</StatValue>
                <StatLabel>{s.label}</StatLabel>
              </StatCard>
            ))}
          </StatsRow>
        </LeftCenter>

        <LeftQuote style={{ zIndex: 2 }}>
          "Chega de esperar o grupo decidir. Entre, encontre um jogo e vá jogar."
        </LeftQuote>
      </LeftPanel>

      <RightPanel>
        <Card>{children}</Card>
      </RightPanel>
    </Wrapper>
  )
}
