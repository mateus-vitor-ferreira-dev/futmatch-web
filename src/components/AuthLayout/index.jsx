import { useState, useEffect, useRef } from 'react'
import { useSports } from '../../hooks/useSports'
import {
  Wrapper, LeftPanel, BgImage, BgOverlay,
  Logo, LogoIcon, LogoText, LogoName, LogoTagline,
  LeftCenter, Headline, HeadlineDesc,
  WheelTrack, WheelItem, WheelIcon, WheelText, WheelName, WheelSub,
  StatsRow, StatCard, StatValue, StatLabel,
  LeftQuote, RightPanel, Card,
} from './styles'

// Imagens locais — coloque os arquivos em src/assets/sports/
// e ajuste os nomes de import abaixo conforme seus arquivos
import imgSociety     from '../../assets/sports/society.jpg'
import imgCampo       from '../../assets/sports/campo.jpg'
import imgFutsal      from '../../assets/sports/futsal.jpg'
import imgAreia       from '../../assets/sports/areia.jpg'
import imgVolei       from '../../assets/sports/volei.jpg'
import imgVoleiAreia  from '../../assets/sports/volei_areia.jpg'
import imgHandball    from '../../assets/sports/handball.jpg'
import imgPeteca      from '../../assets/sports/peteca.png'
import imgBeachTennis from '../../assets/sports/beach_tennis.webp'
import imgBasquete    from '../../assets/sports/basquete.jpg'
import imgTenis       from '../../assets/sports/tenis.jpg'

const SPORT_IMAGES = {
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
}

const ITEM_HEIGHT = 56
const INTERVAL    = 3000

const STATS = [
  { value: '847', label: 'jogadores online' },
  { value: '32',  label: 'jogos hoje'       },
  { value: '12',  label: 'cidades'          },
]

const SLOTS = [
  { offset: -2, scale: 0.72, opacity: 0.30 },
  { offset: -1, scale: 0.86, opacity: 0.60 },
  { offset:  0, scale: 1.00, opacity: 1.00 },
  { offset:  1, scale: 0.86, opacity: 0.60 },
  { offset:  2, scale: 0.72, opacity: 0.30 },
]

export default function AuthLayout({ children }) {
  const { sports } = useSports()
  const [activeIdx, setActiveIdx]   = useState(0)
  // Duas camadas para crossfade: slot A e slot B se alternam
  const [layers, setLayers]         = useState({ a: null, b: null, front: 'a' })
  const prevIdxRef                  = useRef(-1)

  // Auto-avança
  useEffect(() => {
    if (!sports.length) return
    const t = setInterval(() => setActiveIdx((i) => (i + 1) % sports.length), INTERVAL)
    return () => clearInterval(t)
  }, [sports.length])

  // Atualiza o crossfade quando muda a imagem
  useEffect(() => {
    if (!sports.length) return
    const sport   = sports[activeIdx]
    const imgUrl  = sport ? (SPORT_IMAGES[sport.id] ?? null) : null
    if (prevIdxRef.current === activeIdx) return
    prevIdxRef.current = activeIdx

    setLayers((prev) => {
      // Alterna qual camada fica na frente
      if (prev.front === 'a') return { a: prev.a, b: imgUrl, front: 'b' }
      return { a: imgUrl, b: prev.b, front: 'a' }
    })
  }, [activeIdx, sports])

  // Inicializa com a primeira imagem
  useEffect(() => {
    if (!sports.length) return
    const first = sports[0]
    const url   = first ? (SPORT_IMAGES[first.id] ?? null) : null
    setLayers({ a: url, b: null, front: 'a' })
  }, [sports.length > 0])

  function cyclicDist(i) {
    const n = sports.length
    if (!n) return 0
    const d = ((i - activeIdx) % n + n) % n
    return d > n / 2 ? d - n : d
  }

  const trackCenter = 260 / 2

  return (
    <Wrapper>
      <LeftPanel>
        {/* Crossfade: camada A */}
        <BgImage $url={layers.a} $visible={layers.front === 'a'} />
        {/* Crossfade: camada B */}
        <BgImage $url={layers.b} $visible={layers.front === 'b'} />
        {/* Overlay escuro para legibilidade */}
        <BgOverlay />

        {/* ── Conteúdo (z-index > 1 para ficar acima do overlay) ── */}
        <Logo style={{ zIndex: 2 }}>
          <LogoIcon>⚽</LogoIcon>
          <LogoText>
            <LogoName>FutMatch</LogoName>
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

          <WheelTrack>
            {sports.map((sport, i) => {
              const d = cyclicDist(i)
              if (Math.abs(d) > 2) return null
              const slot     = SLOTS.find((s) => s.offset === d)
              const isActive = d === 0
              const top      = trackCenter + d * ITEM_HEIGHT - ITEM_HEIGHT / 2

              return (
                <WheelItem
                  key={sport.id}
                  $active={isActive}
                  style={{
                    top,
                    transform: `scale(${slot.scale})`,
                    opacity: slot.opacity,
                    zIndex: isActive ? 5 : 4 - Math.abs(d),
                  }}
                  onClick={() => !isActive && setActiveIdx(i)}
                >
                  <WheelIcon $active={isActive}>{sport.icon}</WheelIcon>
                  <WheelText>
                    <WheelName $active={isActive}>{sport.label}</WheelName>
                    {isActive && <WheelSub>{sport.description}</WheelSub>}
                  </WheelText>
                </WheelItem>
              )
            })}
          </WheelTrack>

          <StatsRow>
            {STATS.map((s) => (
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
